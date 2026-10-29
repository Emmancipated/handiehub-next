import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, passwordSchema } from "@/lib/auth/password";
import { issueVerificationOtp } from "@/lib/auth/verification";
import { emailSchema } from "@/lib/auth/normalize";
import { rateLimit, getClientIp } from "@/lib/security/rateLimit";
import type { RateLimitResult } from "@/lib/security/rateLimit";

const accountTypeSchema = z
  .enum(["buyer", "seller", "user", "handieman"])
  .optional();

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(32).optional(),
  // The UI sends `role`; `accountType` is accepted for API clients.
  accountType: accountTypeSchema,
  role: accountTypeSchema,
});

type SignupInput = z.infer<typeof signupSchema>;

function resolveRole(input: SignupInput): "CUSTOMER" | "SELLER" {
  const value = input.accountType ?? input.role;
  return value === "seller" || value === "handieman" ? "SELLER" : "CUSTOMER";
}

// Abuse protection against scripted account creation / verification-email spam.
const EMAIL_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
const IP_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);

    const checks: Promise<RateLimitResult>[] = [
      rateLimit(`signup:email:${data.email}`, EMAIL_LIMIT),
    ];
    const ip = getClientIp(req);
    if (ip) {
      checks.push(rateLimit(`signup:ip:${ip}`, IP_LIMIT));
    }
    const limits = await Promise.all(checks);

    if (limits.some((l) => !l.allowed)) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(...limits.map((l) => l.retryAfterSeconds)),
            ),
          },
        },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(data.password);
    const role = resolveRole(data);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        roles: [role],
      },
    });

    // Store the OTP before responding so an immediate verify cannot race the
    // write. Email delivery stays non-blocking.
    await issueVerificationOtp(user);

    // Signup deliberately does not create a session: the user must verify
    // their email first. Verification issues the session.
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          emailVerified: false,
        },
        requiresVerification: true,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
