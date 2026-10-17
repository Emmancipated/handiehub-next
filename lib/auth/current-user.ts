import { cookies } from "next/headers";
import { verifyJwt, type JWTPayload } from "@/lib/auth/jwt";
import { getCookieName } from "@/lib/auth/session";

const COOKIE_NAME = getCookieName();

export class AuthError extends Error {
  status = 401;
}

export async function getCurrentUser(): Promise<JWTPayload> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    throw new AuthError();
  }
  try {
    return verifyJwt(token);
  } catch {
    throw new AuthError();
  }
}

export async function requireUserId(): Promise<string> {
  const payload = await getCurrentUser();
  return payload.sub;
}

export async function requireUser(): Promise<JWTPayload> {
  return getCurrentUser();
}