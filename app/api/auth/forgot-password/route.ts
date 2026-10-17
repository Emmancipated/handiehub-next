import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendPasswordResetOtpEmail } from "@/lib/email/sendOtpEmail";
import { generateOtp, hashToken } from "@/lib/auth/otp";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });

    // Always respond the same to avoid email enumeration.
    if (!user) {
      return NextResponse.json({
        message: "If that email is registered, a reset code has been sent.",
      });
    }

    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const otpExpiresAt = new Date(Date.now() + RESET_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtpHash: otpHash,
        passwordResetOtpExpires: otpExpiresAt,
      },
    });

    await sendPasswordResetOtpEmail({
      toEmail: user.email,
      firstName: user.firstName,
      otp,
      expiresInMinutes: 15,
    });

    return NextResponse.json({
      message: "If that email is registered, a reset code has been sent.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}