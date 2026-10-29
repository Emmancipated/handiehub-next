import { prisma } from "@/lib/db/prisma";

export type SellerRating = { ratingAvg: number; reviewCount: number };

/**
 * Aggregate review ratings for a page of sellers in a single query instead of
 * one query per seller card.
 */
export async function getSellerRatings(
  sellerIds: string[],
): Promise<Map<string, SellerRating>> {
  const ids = [...new Set(sellerIds)];
  if (ids.length === 0) {
    return new Map();
  }

  const grouped = await prisma.review.groupBy({
    by: ["sellerId"],
    where: { sellerId: { in: ids } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return new Map(
    grouped.map((row) => [
      row.sellerId,
      {
        ratingAvg: row._avg.rating ?? 0,
        reviewCount: row._count._all,
      },
    ]),
  );
}
