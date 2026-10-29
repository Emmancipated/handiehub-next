import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getSellerRatings } from "@/lib/seller/directory";
import { responseTimeLabel } from "@/lib/seller/responseTime";

const sellerQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(48).default(12),
  q: z.string().nullable(),
  profession: z.string().nullable(),
  state: z.string().nullable(),
  verified: z.enum(["true", "false"]).nullable(),
  sort: z.enum(["newest", "rating", "name"]).default("newest"),
});

// The directory is small compared to listings; reading a bounded slice lets us
// derive rating-based ordering and profession facets without extra queries.
const DIRECTORY_SCAN_LIMIT = 500;

type SellerCard = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string;
  description: string | null;
  avatarUrl: string | null;
  professions: string[];
  skills: string[];
  city: string | null;
  state: string | null;
  country: string;
  responseTime: string | null;
  responseTimeLabel: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  isTopSeller: boolean;
  memberSince: Date;
  stats: {
    listingCount: number;
    reviewCount: number;
    averageRating: number | null;
  };
  startingPriceMinor: string | null;
};

/**
 * Public seller/handieman directory. Backs the "Hire Professionals" browse
 * experience; authentication is not required.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = sellerQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      q: searchParams.get("q"),
      profession: searchParams.get("profession"),
      state: searchParams.get("state"),
      verified: searchParams.get("verified"),
      sort: searchParams.get("sort") ?? undefined,
    });

    const { page, limit, q, profession, state, verified, sort } = parsed;

    const where: Record<string, unknown> = {
      onboardingCompletedAt: { not: null },
      user: { roles: { has: "SELLER" } },
    };
    if (profession) where.professions = { has: profession };
    if (state) where.state = state;
    if (verified) where.isVerified = verified === "true";
    if (q) {
      where.OR = [
        { businessName: { contains: q, mode: "insensitive" } },
        { professions: { has: q } },
        { user: { firstName: { contains: q, mode: "insensitive" } } },
        { user: { lastName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const profiles = await prisma.sellerProfile.findMany({
      where,
      take: DIRECTORY_SCAN_LIMIT,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            listings: {
              where: { status: "ACTIVE" },
              select: { id: true, priceMinor: true },
            },
          },
        },
      },
    });

    const ratings = await getSellerRatings(profiles.map((profile) => profile.userId));

    const cards: SellerCard[] = profiles.map((profile) => {
      const rating = ratings.get(profile.userId);
      const prices = profile.user.listings
        .map((listing) => listing.priceMinor)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      return {
        id: profile.userId,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        businessName: profile.businessName,
        description: profile.description,
        avatarUrl: profile.avatarUrl,
        professions: profile.professions,
        skills: profile.skills,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        responseTime: profile.responseTime,
        responseTimeLabel: responseTimeLabel(profile.responseTime),
        isVerified: profile.isVerified,
        isFeatured: profile.isFeatured,
        isTopSeller: profile.isTopSeller,
        memberSince: profile.user.createdAt,
        stats: {
          listingCount: profile.user.listings.length,
          reviewCount: rating?.reviewCount ?? 0,
          averageRating: rating && rating.reviewCount > 0 ? Number(rating.ratingAvg.toFixed(2)) : null,
        },
        startingPriceMinor: prices.length > 0 ? prices[0].toString() : null,
      };
    });

    cards.sort((a, b) => {
      if (sort === "name") {
        return a.businessName.localeCompare(b.businessName);
      }
      if (sort === "rating") {
        const ratingDiff =
          (b.stats.averageRating ?? 0) - (a.stats.averageRating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return b.stats.reviewCount - a.stats.reviewCount;
      }
      return b.memberSince.getTime() - a.memberSince.getTime();
    });

    const total = cards.length;
    const start = (page - 1) * limit;
    const paged = cards.slice(start, start + limit);

    const professions = [...new Set(cards.flatMap((card) => card.professions))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      sellers: paged,
      professions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("List sellers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
