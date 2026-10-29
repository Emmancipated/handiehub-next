import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { issueVerificationOtp } from "@/lib/auth/verification";
import { emailSchema } from "@/lib/auth/normalize";
import { clearRateLimit, rateLimit, getClientIp } from "@/lib/security/rateLimit";
import type { RateLimitResult } from "@/lib/security/rateLimit";

const resendSchema = z.object({
  email: emailSchema,
});

// Abuse protection: cap resend emails per address and per client IP.
const EMAIL_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
const IP_LIMIT = { limit: 20, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = resendSchema.parse(body);

    const checks: Promise<RateLimitResult>[] = [
      rateLimit(`resend-verification:email:${data.email}`, EMAIL_LIMIT),
    ];
    const ip = getClientIp(req);
    if (ip) {
      checks.push(rateLimit(`resend-verification:ip:${ip}`, IP_LIMIT));
    }
    const limits = await Promise.all(checks);
    const blocked = limits.find((l) => !l.allowed);

    if (blocked) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
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

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      // Don't reveal whether the email exists.
      return NextResponse.json({
        message:
          "If that email is registered, a verification code has been sent.",
      });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({
        message: "Email is already verified.",
      });
    }

    await issueVerificationOtp(user);

    // A new code deserves a fresh attempt budget.
    await clearRateLimit(`verify:email:${data.email}`);

    return NextResponse.json({
      message:
        "If that email is registered, a verification code has been sent.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
