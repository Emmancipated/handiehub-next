/**
 * Shared password policy (safe to import from client components).
 *
 * Keep this in sync with the server-side Zod schema in `lib/auth/password.ts`.
 * The trusted Nest build required eight characters, an uppercase letter, a
 * number and a special character.
 */
export const PASSWORD_MIN_LENGTH = 8;

export function getPasswordError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(password)) {
    return "Password must contain at least one special character";
  }
  return null;
}

export const PASSWORD_HINT =
  "8+ characters with an uppercase letter, a number and a special character.";
