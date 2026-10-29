import { prisma } from "@/lib/db/prisma";
import { sendOtpEmail } from "@/lib/email/sendOtpEmail";
import { generateOtp, hashToken, OTP_TTL_MINUTES } from "@/lib/auth/otp";

type VerificationUser = {
  id: string;
  email: string;
  firstName: string;
};

/**
 * Generate a new email-verification OTP, persist its hash and deliver it.
 * The database write is awaited so a verify request cannot race it; email
 * delivery is intentionally non-blocking.
 */
export async function issueVerificationOtp(
  user: VerificationUser,
): Promise<void> {
  const otp = generateOtp();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpHash: hashToken(otp),
      otpExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  void sendOtpEmail({
    toEmail: user.email,
    firstName: user.firstName,
    otp,
    expiresInMinutes: OTP_TTL_MINUTES,
  }).catch((err) => console.error("Failed to send verification OTP:", err));
}
