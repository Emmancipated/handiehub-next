import type { Prisma } from "@/generated/prisma/client";

type StockItem = {
  listingId: string | null;
  quantity: number;
};

/**
 * Return reserved stock to listings when an order is cancelled or deleted.
 * Listings without tracked stock (`stockOnHand` null) are unaffected.
 */
export async function restoreReservedStock(
  tx: Prisma.TransactionClient,
  items: StockItem[],
): Promise<void> {
  for (const item of items) {
    if (!item.listingId) continue;
    await tx.listing.updateMany({
      where: { id: item.listingId, stockOnHand: { not: null } },
      data: { stockOnHand: { increment: item.quantity } },
    });
  }
}
