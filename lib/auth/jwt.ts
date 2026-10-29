import jwt, { SignOptions } from "jsonwebtoken";

export type JWTPayload = {
  sub: string;
  email: string;
  roles: string[];
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

/**
 * Parse a duration such as `1h`, `30m`, `7d` into seconds. Falls back when the
 * value is missing or malformed so a bad env var cannot produce a zero-length
 * session.
 */
export function parseDurationSeconds(
  value: string | undefined,
  fallbackSeconds: number,
): number {
  if (!value) return fallbackSeconds;

  const match = /^(\d+)\s*(s|m|h|d|w)?$/i.exec(value.trim());
  if (!match) return fallbackSeconds;

  const amount = Number(match[1]);
  const unit = (match[2] ?? "s").toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
    w: 7 * 24 * 60 * 60,
  };

  const seconds = amount * (multipliers[unit] ?? 1);
  return seconds > 0 ? seconds : fallbackSeconds;
}

/** Access-token lifetime. Nest used 24h; Next uses a short-lived token. */
export const ACCESS_TOKEN_TTL =
  process.env.JWT_EXPIRES_IN?.trim() || "1h";

/** Refresh-token lifetime in days (30 days by default). */
export const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS || 30);

export const REFRESH_TTL_MS =
  (Number.isFinite(REFRESH_TTL_DAYS) && REFRESH_TTL_DAYS > 0
    ? REFRESH_TTL_DAYS
    : 30) *
  24 *
  60 *
  60 *
  1000;

export function signJwt(
  payload: JWTPayload,
  expiresIn: SignOptions["expiresIn"] = ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
): string {
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyJwt(token: string): JWTPayload {
  return jwt.verify(token, getSecret()) as unknown as JWTPayload;
}
