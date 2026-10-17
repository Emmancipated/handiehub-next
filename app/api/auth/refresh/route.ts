import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { signJwt, REFRESH_TTL_MS } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Refresh-token rotation.
 *
 * The currently-stored refresh-token hash is the only valid token for this
 * session. When a token is used we immediately rotate to a brand-new token,
 * so a stolen token can never be reused after the legitimate client rotates.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = refreshSchema.parse(body);

    const tokenHash = hashToken(data.refreshToken);

    const user = await prisma.user.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        refreshTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 },
      );
    }

    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const newExpires = new Date(Date.now() + REFRESH_TTL_MS);
    const newFamily = crypto.randomUUID();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        refreshTokenExpires: newExpires,
        refreshTokenFamily: newFamily,
      },
    });

    const accessToken = signJwt(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      },
      "7d",
    );

    const res = NextResponse.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      refresh_token_expires: newExpires.toISOString(),
    });

    setSessionCookie(res, accessToken, newRefreshToken, newExpires);
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