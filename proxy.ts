import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCookieName } from "@/lib/auth/cookies";
import { jwtVerify } from "jose";

const COOKIE_NAME = getCookieName();

const PUBLIC_PATHS = [
  "/api/auth/signup",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/verify",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
  "/api/webhook/paystack",
  "/api/orders/cleanup",
];

// Public read-only resources that do not require a session. The handler itself
// still decides exactly what is exposed.
const PUBLIC_GET_PREFIXES = [
  "/api/listings",
  "/api/reviews",
  "/api/sellers",
];

// Read routes that share a public prefix but still require a session.
const PRIVATE_GET_PREFIXES = ["/api/listings/mine"];

/**
 * Next.js 16 renamed Middleware to Proxy. This runs before API routes so a
 * request without a valid access token never reaches a handler. Page-level
 * authorization lives in the dashboard layouts (`lib/auth/guards.ts`).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (
    request.method === "GET" &&
    !PRIVATE_GET_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) &&
    PUBLIC_GET_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
