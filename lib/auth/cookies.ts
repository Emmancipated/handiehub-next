/**
 * Cookie names shared by the proxy, API routes, and server guards.
 *
 * This module deliberately has no server-only or Node-only imports so the
 * proxy can read cookie names without pulling the JWT implementation into its
 * bundle.
 */
export const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "hh_session";
export const REFRESH_COOKIE_NAME =
  process.env.AUTH_REFRESH_COOKIE_NAME || "refresh";
export const REFRESH_COOKIE_PATH = "/api/auth";

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getRefreshCookieName(): string {
  return REFRESH_COOKIE_NAME;
}

export function getRefreshCookiePath(): string {
  return REFRESH_COOKIE_PATH;
}
