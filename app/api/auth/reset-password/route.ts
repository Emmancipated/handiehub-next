import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signJwt, REFRESH_TTL_MS } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/otp";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = resetPasswordSchema.parse(body);

    const otpHash = hashToken(data.otp);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or OTP" },
        { status: 400 },
      );
    }

    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpires) {
      return NextResponse.json(
        { error: "No pending password reset for this email" },
        { status: 400 },
      );
    }

    if (new Date() > user.passwordResetOtpExpires) {
      return NextResponse.json(
        { error: "Reset code has expired" },
        { status: 400 },
      );
    }

    if (user.passwordResetOtpHash !== otpHash) {
      return NextResponse.json(
        { error: "Invalid reset code" },
        { status: 400 },
      );
    }

    const newPasswordHash = await hashPassword(data.newPassword);

    // Rotate refresh tokens so any stale session is invalidated.
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpires = new Date(Date.now() + REFRESH_TTL_MS);
    const refreshTokenFamily = crypto.randomUUID();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetOtpHash: null,
        passwordResetOtpExpires: null,
        refreshTokenHash,
        refreshTokenExpires,
        refreshTokenFamily,
      },
    });

    const accessToken = signJwt(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      },
      "7d",
    );

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        emailVerified: user.emailVerifiedAt ? true : false,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      refresh_token_expires: refreshTokenExpires.toISOString(),
    });

    setSessionCookie(res, accessToken, refreshToken, refreshTokenExpires);
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