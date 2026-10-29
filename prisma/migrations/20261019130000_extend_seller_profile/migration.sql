-- Extend the seller profile to carry the fields captured by the onboarding
-- wizard (business details, professions/skills, delivery ranges, media).
ALTER TABLE "SellerProfile"
    ADD COLUMN "address" VARCHAR(255),
    ADD COLUMN "avatarUrl" VARCHAR(500),
    ADD COLUMN "professions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "productsImageUrl" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "responseTime" VARCHAR(80),
    ADD COLUMN "intraStateDeliveryMinDays" INTEGER,
    ADD COLUMN "intraStateDeliveryMaxDays" INTEGER,
    ADD COLUMN "interStateDeliveryMinDays" INTEGER,
    ADD COLUMN "interStateDeliveryMaxDays" INTEGER,
    ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "isTopSeller" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

CREATE INDEX "SellerProfile_onboardingCompletedAt_idx"
    ON "SellerProfile" ("onboardingCompletedAt");
