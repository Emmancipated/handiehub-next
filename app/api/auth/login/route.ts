import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { signJwt } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { comparePassword } from "@/lib/auth/password";
import { emailSchema } from "@/lib/auth/normalize";
import { issueVerificationOtp } from "@/lib/auth/verification";
import { issueRefreshToken } from "@/lib/auth/tokens";
import {
  rateLimit,
  clearRateLimit,
  getClientIp,
} from "@/lib/security/rateLimit";
import type { RateLimitResult } from "@/lib/security/rateLimit";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Abuse protection against credential stuffing / brute force.
const EMAIL_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };
const IP_LIMIT = { limit: 30, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const emailKey = `login:email:${data.email}`;
    const ip = getClientIp(req);
    const ipKey = ip ? `login:ip:${ip}` : null;

    const checks: Promise<RateLimitResult>[] = [
      rateLimit(emailKey, EMAIL_LIMIT),
    ];
    if (ipKey) {
      checks.push(rateLimit(ipKey, IP_LIMIT));
    }
    const limits = await Promise.all(checks);

    if (limits.some((l) => !l.allowed)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
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

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await comparePassword(data.password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Parity with the trusted Nest flow: unverified users cannot sign in.
    // Send a fresh code so the verification screen can be used immediately.
    if (!user.emailVerifiedAt) {
      await issueVerificationOtp(user);
      return NextResponse.json(
        {
          error: "Please verify your email address to continue.",
          code: "EMAIL_NOT_VERIFIED",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 },
      );
    }

    // Successful login clears the per-account counter so a few typos don't lock
    // the user out. The per-IP counter is left to decay on its own.
    await clearRateLimit(emailKey);

    const refresh = await issueRefreshToken(user.id, undefined, {
      userAgent: req.headers.get("user-agent"),
      ip,
    });

    const accessToken = signJwt({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        emailVerified: true,
      },
    });

    setSessionCookie(res, accessToken, refresh.token, refresh.expiresAt);
    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
