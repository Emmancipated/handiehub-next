import { z } from "zod";

/**
 * Canonical form for user emails.
 *
 * Emails are stored and looked up in this form so that `User@Example.com` and
 * `user@example.com` cannot become two accounts. The database also has a
 * case-insensitive unique index as a second line of defence.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalize before validating: `z.string().email().transform(...)` would reject
 * an address with surrounding whitespace before the transform runs.
 */
export const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeEmail(value) : value),
  z.string().email("Invalid email address"),
);
