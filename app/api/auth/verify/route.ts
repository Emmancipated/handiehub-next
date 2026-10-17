import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { signJwt, REFRESH_TTL_MS } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/otp";

const verifySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = verifySchema.parse(body);

    const otpHash = hashToken(data.otp);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or OTP" },
        { status: 400 },
      );
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return NextResponse.json(
        { error: "No pending verification for this email" },
        { status: 400 },
      );
    }

    if (new Date() > user.otpExpiresAt) {
      return NextResponse.json(
        { error: "OTP has expired" },
        { status: 400 },
      );
    }

    if (user.otpHash !== otpHash) {
      return NextResponse.json(
        { error: "Invalid OTP" },
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

    // Issue fresh tokens after verification.
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpires = new Date(Date.now() + REFRESH_TTL_MS);
    const refreshTokenFamily = crypto.randomUUID();

    await prisma.user.update({
      where: { id: user.id },
      data: {
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
        emailVerified: true,
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
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}