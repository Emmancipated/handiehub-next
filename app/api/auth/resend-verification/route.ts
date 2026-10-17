import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendOtpEmail } from "@/lib/email/sendOtpEmail";
import { generateOtp, hashToken } from "@/lib/auth/otp";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = resendSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      // Don't reveal whether the email exists.
      return NextResponse.json({
        message: "If that email is registered, a verification code has been sent.",
      });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({
        message: "Email is already verified.",
      });
    }

    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash, otpExpiresAt },
    });

    await sendOtpEmail({
      toEmail: user.email,
      firstName: user.firstName,
      otp,
      expiresInMinutes: 15,
    });

    return NextResponse.json({
      message: "If that email is registered, a verification code has been sent.",
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