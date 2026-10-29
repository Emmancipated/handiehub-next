-- Refresh tokens move from a single hashed column on User to a dedicated
-- table so sessions can rotate per device and reuse can be detected.
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "familyId" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByTokenHash" VARCHAR(128),
    "userAgent" VARCHAR(512),
    "ip" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User"
    DROP COLUMN "refreshTokenHash",
    DROP COLUMN "refreshTokenExpires",
    DROP COLUMN "refreshTokenFamily";

-- Emails are normalized in application code and protected by a
-- case-insensitive unique index so `User@Example.com` cannot create a second
-- account. Fail loudly if existing data already contains such a duplicate.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "User"
        GROUP BY lower(trim("email"))
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate case-insensitive emails exist. Resolve them before applying this migration.';
    END IF;
END $$;

UPDATE "User"
SET "email" = lower(trim("email"))
WHERE "email" <> lower(trim("email"));

CREATE UNIQUE INDEX "User_email_lower_key" ON "User" (lower("email"));
