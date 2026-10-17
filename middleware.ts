import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt, type JWTPayload } from "@/lib/auth/jwt";
import { getCookieName } from "@/lib/auth/session";

const COOKIE_NAME = getCookieName();

const PUBLIC_PATHS = [
  "/api/auth/signup",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
  "/api/webhook/paystack",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      verifyJwt(token);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

export type { JWTPayload };