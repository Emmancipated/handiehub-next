import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendPasswordResetOtpEmail } from "@/lib/email/sendOtpEmail";
import { generateOtp, hashToken, OTP_TTL_MINUTES } from "@/lib/auth/otp";
import { emailSchema } from "@/lib/auth/normalize";
import { clearRateLimit, rateLimit, getClientIp } from "@/lib/security/rateLimit";
import type { RateLimitResult } from "@/lib/security/rateLimit";

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Abuse protection: cap reset emails per address and per client IP.
const EMAIL_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
const IP_LIMIT = { limit: 20, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = forgotPasswordSchema.parse(body);

    // Throttle before any work so a known and unknown email behave identically.
    const checks: Promise<RateLimitResult>[] = [
      rateLimit(`forgot-password:email:${data.email}`, EMAIL_LIMIT),
    ];
    const ip = getClientIp(req);
    if (ip) {
      checks.push(rateLimit(`forgot-password:ip:${ip}`, IP_LIMIT));
    }
    const limits = await Promise.all(checks);
    const blocked = limits.find((l) => !l.allowed);

    if (blocked) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again later." },
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

    // Always respond the same to avoid email enumeration.
    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[auth] Password reset requested for an email with no account: ${data.email}`,
        );
      }
      return NextResponse.json({
        message: "If that email is registered, a reset code has been sent.",
      });
    }

    const otp = generateOtp();
    const otpHash = hashToken(otp);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtpHash: otpHash,
        passwordResetOtpExpires: new Date(
          Date.now() + OTP_TTL_MINUTES * 60 * 1000,
        ),
      },
    });

    // A new code gets a fresh attempt budget.
    await clearRateLimit(`reset-password:email:${data.email}`);

    const sent = await sendPasswordResetOtpEmail({
      toEmail: user.email,
      firstName: user.firstName,
      otp,
      expiresInMinutes: OTP_TTL_MINUTES,
    });

    if (!sent) {
      console.warn(
        `[auth] Password reset email was NOT sent to ${user.email}. Check RESEND_API_KEY and MAIL_SENDER_DEFAULT.`,
      );
    }

    // In development, surface the code so the flow is testable without an inbox.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[auth] Password reset code for ${user.email}: ${otp}`);
    }

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
