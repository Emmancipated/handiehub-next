import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUserId } from "@/lib/auth/current-user";
import { getRefreshCookieName, clearSessionCookie } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/otp";
import { revokeAllRefreshTokens } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db/prisma";

/**
 * Logout clears both cookies and revokes every refresh token for the user.
 *
 * The access token may already be expired, so we fall back to the refresh
 * cookie to identify the user. An unauthenticated logout still clears the
 * cookies, which keeps the endpoint idempotent.
 */
export async function POST() {
  let userId: string | null = null;

  try {
    userId = await requireUserId();
  } catch {
    const refreshToken = (await cookies()).get(getRefreshCookieName())?.value;
    if (refreshToken) {
      const stored = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashToken(refreshToken) },
        select: { userId: true },
      });
      userId = stored?.userId ?? null;
    }
  }

  try {
    if (userId) {
      await revokeAllRefreshTokens(userId);
    }
  } catch (error) {
    console.error("Logout token revocation error:", error);
  }

  const res = NextResponse.json({ message: "Logged out successfully" });
  clearSessionCookie(res);
  return res;
}
