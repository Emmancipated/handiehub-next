import crypto from "crypto";

/**
 * Generate a random numeric OTP of the given length (default 6).
 * Uses crypto.randomInt for cryptographically-secure values.
 */
export function generateOtp(size = 6): string {
  const max = 10 ** size;
  const value = crypto.randomInt(0, max);
  return value.toString().padStart(size, "0");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}