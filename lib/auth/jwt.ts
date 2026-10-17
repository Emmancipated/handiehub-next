import { cookies } from "next/headers";
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

export function signJwt(
  payload: JWTPayload,
  expiresIn: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
): string {
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyJwt(token: string): JWTPayload {
  return jwt.verify(token, getSecret()) as unknown as JWTPayload;
}

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getAuthenticatedUser(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = (await cookieStore).get(process.env.AUTH_COOKIE_NAME || "hh_session")?.value;
  if (!token) return null;
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}