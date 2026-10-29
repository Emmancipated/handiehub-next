import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { signJwt } from "@/lib/auth/jwt";
import {
  getRefreshCookieName,
  setSessionCookie,
} from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/otp";
import {
  pruneExpiredRefreshTokens,
  revokeRefreshFamily,
  rotateRefreshToken,
} from "@/lib/auth/tokens";

const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

/**
 * Refresh-token rotation with reuse detection.
 *
 * Every login starts a token family. On refresh the old token is revoked and
 * replaced atomically. If a revoked token is presented again, the whole family
 * is revoked: either the old token was stolen or the client is replaying it.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = refreshSchema.parse(body);

    const cookieToken = (await cookies()).get(getRefreshCookieName())?.value;
    const token = data.refreshToken ?? cookieToken;

    if (!token) {
      return NextResponse.json(
        { error: "Refresh token is required", code: "REFRESH_TOKEN_MISSING" },
        { status: 401 },
      );
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!stored) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token", code: "INVALID_REFRESH_TOKEN" },
        { status: 401 },
      );
    }

    // Reuse of an already-rotated token invalidates the entire family. A short
    // grace window avoids logging the user out when two tabs refresh at the
    // same moment; the losing request retries with the winner's new cookie.
    if (stored.revokedAt) {
      const revokedAgoMs = Date.now() - stored.revokedAt.getTime();
      if (revokedAgoMs < 30_000) {
        return NextResponse.json(
          {
            error: "Another refresh is in progress",
            code: "REFRESH_IN_PROGRESS",
          },
          { status: 401 },
        );
      }

      await revokeRefreshFamily(stored.familyId);
      return NextResponse.json(
        { error: "Refresh token has already been used", code: "REFRESH_TOKEN_REUSED" },
        { status: 401 },
      );
    }

    if (stored.expiresAt <= new Date()) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      return NextResponse.json(
        { error: "Refresh token expired", code: "REFRESH_TOKEN_EXPIRED" },
        { status: 401 },
      );
    }

    if (!stored.user.emailVerifiedAt) {
      await revokeRefreshFamily(stored.familyId);
      return NextResponse.json(
        {
          error: "Please verify your email address to continue",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 },
      );
    }

    const rotated = await rotateRefreshToken(stored, {
      userAgent: req.headers.get("user-agent"),
      ip: stored.ip,
    });

    const accessToken = signJwt({
      sub: stored.user.id,
      email: stored.user.email,
      roles: stored.user.roles,
    });

    const res = NextResponse.json({
      user: {
        id: stored.user.id,
        email: stored.user.email,
        firstName: stored.user.firstName,
        lastName: stored.user.lastName,
        roles: stored.user.roles,
        emailVerified: true,
      },
    });

    setSessionCookie(res, accessToken, rotated.token, rotated.expiresAt);

    void pruneExpiredRefreshTokens().catch(() => {
      /* best-effort cleanup */
    });

    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
