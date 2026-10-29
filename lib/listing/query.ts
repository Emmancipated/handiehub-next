import { prisma } from "@/lib/db/prisma";

export type ListingSort = "newest" | "price-asc" | "price-desc" | "rating";

/**
 * Map a public sort key to a Prisma `orderBy` clause. Kept in one place so the
 * listing feed, category feed and search results order consistently.
 */
export function listingOrderBy(sort: ListingSort) {
  switch (sort) {
    case "price-asc":
      return { priceMinor: "asc" as const };
    case "price-desc":
      return { priceMinor: "desc" as const };
    case "rating":
      return { reviews: { _count: "desc" as const } };
    case "newest":
    default:
      return { createdAt: "desc" as const };
  }
}

export type ListingRating = { ratingAvg: number; reviewCount: number };

/**
 * Aggregate review ratings for a page of listings in a single query instead of
 * one query per card.
 */
export async function getListingRatings(
  listingIds: string[],
): Promise<Map<string, ListingRating>> {
  const ids = [...new Set(listingIds)];
  if (ids.length === 0) {
    return new Map();
  }

  const grouped = await prisma.review.groupBy({
    by: ["listingId"],
    where: { listingId: { in: ids } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return new Map(
    grouped.map((row) => [
      row.listingId,
      {
        ratingAvg: row._avg.rating ?? 0,
        reviewCount: row._count._all,
      },
    ]),
  );
}

/**
 * Attach `ratingAvg` / `reviewCount` to each listing. Listings without reviews
 * fall back to zero so clients can render a stable shape.
 */
export function withListingRatings<T extends { id: string }>(
  listings: T[],
  ratings: Map<string, ListingRating>,
) {
  return listings.map((listing) => ({
    ...listing,
    ...(ratings.get(listing.id) ?? { ratingAvg: 0, reviewCount: 0 }),
  }));
}
