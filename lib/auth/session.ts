import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyJwt, type JWTPayload } from "@/lib/auth/jwt";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "hh_session";

export function buildSessionCookie(
  accessToken: string,
  refreshToken?: string,
  refreshExpires?: Date,
): string {
  const parts = [
    `${COOKIE_NAME}=${accessToken}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=604800`,
  ];
  if (refreshToken && refreshExpires) {
    const maxAge = Math.max(
      0,
      Math.floor((refreshExpires.getTime() - Date.now()) / 1000),
    );
    parts.push(`refresh=${refreshToken}`);
    parts.push(`refresh-max-age=${maxAge}`);
  }
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function buildClearCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

/**
 * Attach the session cookie (and optional refresh token) to a NextResponse.
 */
export function setSessionCookie(
  res: NextResponse,
  accessToken: string,
  refreshToken?: string,
  refreshExpires?: Date,
): NextResponse {
  res.cookies.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 604800,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  if (refreshToken && refreshExpires) {
    res.cookies.set("refresh", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: refreshExpires,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}

export async function getAuthenticatedUser(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = (await cookieStore).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}