import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  parseDurationSeconds,
  verifyJwt,
  type JWTPayload,
} from "@/lib/auth/jwt";
import {
  COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  getCookieName,
  getRefreshCookieName,
  getRefreshCookiePath,
} from "@/lib/auth/cookies";

export {
  getCookieName,
  getRefreshCookieName,
  getRefreshCookiePath,
};

/**
 * Access-token cookie lifetime, derived from JWT_EXPIRES_IN so the cookie and
 * the token cannot disagree.
 */
const ACCESS_TOKEN_MAX_AGE = parseDurationSeconds(
  process.env.JWT_EXPIRES_IN,
  60 * 60,
);

const isProduction = process.env.NODE_ENV === "production";

/**
 * Attach the session cookie (and optional refresh token) to a NextResponse.
 * Tokens are intentionally not returned in response bodies.
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
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
    secure: isProduction,
  });

  if (refreshToken && refreshExpires) {
    res.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: REFRESH_COOKIE_PATH,
      expires: refreshExpires,
      secure: isProduction,
    });
  }

  return res;
}

/** Clear both the access and refresh cookies. */
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    secure: isProduction,
  });
  res.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
    expires: new Date(0),
    secure: isProduction,
  });
  return res;
}

export async function getAuthenticatedUser(): Promise<JWTPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}
