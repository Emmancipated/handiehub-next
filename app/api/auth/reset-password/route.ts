import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, passwordSchema } from "@/lib/auth/password";
import { signJwt } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { hashToken, safeCompareHash } from "@/lib/auth/otp";
import { emailSchema } from "@/lib/auth/normalize";
import {
  issueRefreshToken,
  revokeAllRefreshTokens,
} from "@/lib/auth/tokens";
import {
  clearRateLimit,
  getClientIp,
  rateLimit,
} from "@/lib/security/rateLimit";

const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  newPassword: passwordSchema,
});

const ATTEMPT_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = resetPasswordSchema.parse(body);

    const attemptKey = `reset-password:email:${data.email}`;
    const attempt = await rateLimit(attemptKey, ATTEMPT_LIMIT);
    if (!attempt.allowed) {
      return NextResponse.json(
        {
          error: "Too many reset attempts. Please request a new code.",
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

    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpires) {
      return NextResponse.json(
        {
          error: "No pending password reset for this email",
          code: "NO_PENDING_RESET",
        },
        { status: 400 },
      );
    }

    if (new Date() > user.passwordResetOtpExpires) {
      return NextResponse.json(
        { error: "Reset code has expired", code: "OTP_EXPIRED" },
        { status: 400 },
      );
    }

    if (!safeCompareHash(user.passwordResetOtpHash, hashToken(data.otp))) {
      return NextResponse.json(
        { error: "Invalid reset code", code: "INVALID_OTP" },
        { status: 400 },
      );
    }

    const newPasswordHash = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetOtpHash: null,
        passwordResetOtpExpires: null,
        // Receiving the reset code proves control of the address. Treat this as
        // verification so the user is not left in an unverified dead end.
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    });

    // A password reset invalidates every existing session.
    await revokeAllRefreshTokens(user.id);
    await clearRateLimit(attemptKey);

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
        emailVerified: Boolean(user.emailVerifiedAt),
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
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
