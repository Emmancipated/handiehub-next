import "server-only";
import { prisma } from "@/lib/db/prisma";

export type RateLimitOptions = {
  /** Maximum number of hits allowed within the window. */
  limit: number;
  /** Length of the window in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets; 0 when the request is allowed. */
  retryAfterSeconds: number;
};

/**
 * Fixed-window rate limiter backed by Postgres so the limit holds across
 * serverless instances (an in-memory counter would not). The window starts on
 * the first hit and resets once it expires.
 *
 * The increment is a single atomic UPSERT, so concurrent requests cannot slip
 * past the limit the way a read-then-write could.
 */
export async function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = new Date();
  const nextExpiry = new Date(now.getTime() + windowMs);

  const [row] = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${nextExpiry})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."expiresAt" <= ${now} THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "expiresAt" = CASE
        WHEN "RateLimit"."expiresAt" <= ${now} THEN ${nextExpiry}
        ELSE "RateLimit"."expiresAt"
      END
    RETURNING "count", "expiresAt"
  `;

  const allowed = row.count <= limit;
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000));

  // Opportunistic cleanup so one-off keys don't accumulate forever.
  if (Math.random() < 0.02) {
    await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "expiresAt" < ${now}`;
  }

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterSeconds,
  };
}

/** Best-effort client IP for throttling. Returns null when it can't be determined. */
export function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || null;
}

/** Clears a single counter, e.g. after a successful login. */
export async function clearRateLimit(key: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "key" = ${key}`;
}
