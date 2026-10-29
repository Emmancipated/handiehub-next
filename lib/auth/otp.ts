import crypto from "crypto";

/** OTP lifetime, matching the trusted Nest build (10 minutes). */
export const OTP_TTL_MINUTES = 10;

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

/**
 * Compare two SHA-256 hex digests in constant time. Returns false for
 * malformed or unequal-length input instead of throwing.
 */
export function safeCompareHash(left: string, right: string): boolean {
  try {
    const a = Buffer.from(left, "hex");
    const b = Buffer.from(right, "hex");
    if (a.length === 0 || a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
