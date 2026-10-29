import crypto from "crypto";
import type { RefreshToken } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { REFRESH_TTL_MS } from "@/lib/auth/jwt";
import { hashToken } from "@/lib/auth/otp";

export type RefreshTokenMeta = {
  userAgent?: string | null;
  ip?: string | null;
};

export type IssuedRefreshToken = {
  token: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
};

/**
 * Create a refresh token for a new login session. Each login gets its own
 * family so sessions on different devices rotate independently.
 */
export async function issueRefreshToken(
  userId: string,
  familyId = crypto.randomUUID(),
  meta?: RefreshTokenMeta,
): Promise<IssuedRefreshToken> {
  const token = crypto.randomBytes(64).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      familyId,
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
    },
  });

  return { token, tokenHash, familyId, expiresAt };
}

/**
 * Rotate a refresh token inside a single transaction: the old token is
 * revoked and the replacement is written atomically.
 */
export async function rotateRefreshToken(
  current: RefreshToken,
  meta?: RefreshTokenMeta,
): Promise<IssuedRefreshToken> {
  const token = crypto.randomBytes(64).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: current.id },
      data: { revokedAt: new Date(), replacedByTokenHash: tokenHash },
    }),
    prisma.refreshToken.create({
      data: {
        userId: current.userId,
        tokenHash,
        familyId: current.familyId,
        expiresAt,
        userAgent: meta?.userAgent ?? null,
        ip: meta?.ip ?? null,
      },
    }),
  ]);

  return {
    token,
    tokenHash,
    familyId: current.familyId,
    expiresAt,
  };
}

/** Revoke every still-active token in a rotation family. */
export async function revokeRefreshFamily(familyId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Revoke every refresh token for a user (logout, password reset). */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Best-effort cleanup of expired tokens. */
export async function pruneExpiredRefreshTokens(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: cutoff } },
  });
}
