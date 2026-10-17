import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { signJwt, REFRESH_TTL_MS } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { sendOtpEmail } from "@/lib/email/sendOtpEmail";
import { generateOtp } from "@/lib/auth/otp";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        roles: ["CUSTOMER"],
      },
    });

    // Issue access + refresh tokens so the user is logged in immediately.
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

    // Send verification OTP (fire-and-forget, non-blocking).
    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    prisma.user
      .update({
        where: { id: user.id },
        data: { otpHash, otpExpiresAt },
      })
      .then(() =>
        sendOtpEmail({
          toEmail: user.email,
          firstName: user.firstName,
          otp,
          expiresInMinutes: 15,
        }),
      )
      .catch((err) => console.error("Failed to send verification OTP:", err));

    const res = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          emailVerified: false,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        refresh_token_expires: refreshTokenExpires.toISOString(),
      },
      { status: 201 },
    );

    setSessionCookie(res, accessToken, refreshToken, refreshTokenExpires);
    return res;
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