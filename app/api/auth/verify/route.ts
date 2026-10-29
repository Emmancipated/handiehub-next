import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { signJwt } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { hashToken, safeCompareHash } from "@/lib/auth/otp";
import { emailSchema } from "@/lib/auth/normalize";
import { issueRefreshToken } from "@/lib/auth/tokens";
import { rateLimit, clearRateLimit, getClientIp } from "@/lib/security/rateLimit";

const verifySchema = z.object({
  email: emailSchema,
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

// Verification attempts are capped so a 6-digit code cannot be brute-forced
// during its lifetime.
const ATTEMPT_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = verifySchema.parse(body);

    const attemptKey = `verify:email:${data.email}`;
    const attempt = await rateLimit(attemptKey, ATTEMPT_LIMIT);
    if (!attempt.allowed) {
      return NextResponse.json(
        {
          error: "Too many verification attempts. Please request a new code.",
          code: "OTP_ATTEMPTS_EXCEEDED",
        },
        {
          status: 429,
          headers: { "Retry-After": String(attempt.retryAfterSeconds) },
        },
      );
    }

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or OTP" },
        { status: 400 },
      );
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return NextResponse.json(
        { error: "No pending verification for this email", code: "NO_PENDING_OTP" },
        { status: 400 },
      );
    }

    if (new Date() > user.otpExpiresAt) {
      return NextResponse.json(
        { error: "OTP has expired", code: "OTP_EXPIRED" },
        { status: 400 },
      );
    }

    if (!safeCompareHash(user.otpHash, hashToken(data.otp))) {
      return NextResponse.json(
        { error: "Invalid OTP", code: "INVALID_OTP" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash: null,
        otpExpiresAt: null,
        emailVerifiedAt: new Date(),
      },
    });

    await clearRateLimit(attemptKey);

    // Verification establishes the session. This keeps the Nest verify-first
    // flow without forcing the user to log in a second time.
    const refresh = await issueRefreshToken(user.id, undefined, {
      userAgent: req.headers.get("user-agent"),
      ip: getClientIp(req),
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
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
