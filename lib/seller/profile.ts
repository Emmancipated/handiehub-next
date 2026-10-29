import type { SellerProfile } from "@/generated/prisma/client";
import { formatDeliveryEstimate } from "@/lib/seller/delivery";
import { responseTimeLabel } from "@/lib/seller/responseTime";

/**
 * Fields required before a seller can publish listings. Onboarding sets these
 * across the three wizard steps; `onboardingCompletedAt` is stamped once they
 * are all present.
 */
export type SellerProfileCompletenessInput = Pick<
  SellerProfile,
  | "businessName"
  | "phoneNumber"
  | "country"
  | "state"
  | "city"
  | "address"
  | "professions"
  | "skills"
>;

export function isSellerProfileComplete(
  profile: SellerProfileCompletenessInput | null | undefined,
): boolean {
  if (!profile) return false;

  return Boolean(
    profile.businessName?.trim() &&
      profile.phoneNumber?.trim() &&
      profile.country?.trim() &&
      profile.state?.trim() &&
      profile.city?.trim() &&
      profile.address?.trim() &&
      Array.isArray(profile.professions) &&
      profile.professions.length > 0 &&
      Array.isArray(profile.skills) &&
      profile.skills.length > 0,
  );
}

function serializeDeliveryEstimate(
  minMinutes: number | null,
  maxMinutes: number | null,
) {
  if (minMinutes == null || maxMinutes == null) return null;

  return {
    minMinutes,
    maxMinutes,
    label: formatDeliveryEstimate(minMinutes, maxMinutes),
  };
}

/** Shape returned to the client (no internal ids beyond the profile id). */
export function serializeSellerProfile(profile: SellerProfile) {
  return {
    id: profile.id,
    userId: profile.userId,
    businessName: profile.businessName,
    description: profile.description,
    phoneNumber: profile.phoneNumber,
    country: profile.country,
    state: profile.state,
    city: profile.city,
    address: profile.address,
    avatarUrl: profile.avatarUrl,
    professions: profile.professions,
    skills: profile.skills,
    productsImageUrl: profile.productsImageUrl,
    responseTime: profile.responseTime,
    responseTimeLabel: responseTimeLabel(profile.responseTime),
    intraStateDelivery: serializeDeliveryEstimate(
      profile.intraStateDeliveryMinMinutes,
      profile.intraStateDeliveryMaxMinutes,
    ),
    interStateDelivery: serializeDeliveryEstimate(
      profile.interStateDeliveryMinMinutes,
      profile.interStateDeliveryMaxMinutes,
    ),
    isVerified: profile.isVerified,
    isFeatured: profile.isFeatured,
    isTopSeller: profile.isTopSeller,
    verifiedAt: profile.verifiedAt,
    onboardingCompletedAt: profile.onboardingCompletedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
