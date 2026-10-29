import bcrypt from "bcryptjs";
import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/passwordPolicy";

const SALT_ROUNDS = 12;

/**
 * Password policy carried over from the trusted Nest build: at least eight
 * characters with an uppercase letter, a number and a special character.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/,
    "Password must contain at least one special character",
  );

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
