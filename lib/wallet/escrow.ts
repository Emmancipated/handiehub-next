import type { Prisma } from "@/generated/prisma/client";

export const PLATFORM_FEE_PERCENT = BigInt(5);

/**
 * Release the seller's escrow hold once an order is complete. Idempotent via
 * fixed ledger keys so a retried webhook or a double-click cannot pay twice.
 */
export async function releaseEscrowForOrder(
  tx: Prisma.TransactionClient,
  order: {
    id: string;
    sellerId: string;
    totalMinor: bigint;
    currency: string;
  },
): Promise<boolean> {
  const hold = await tx.ledgerEntry.findFirst({
    where: { orderId: order.id, kind: "ESCROW_HOLD", direction: "DEBIT" },
  });
  if (!hold) return false;

  const alreadyReleased = await tx.ledgerEntry.findUnique({
    where: { idempotencyKey: `escrow-release:${order.id}` },
  });
  if (alreadyReleased) return false;

  const amount = hold.amountMinor;
  const fee = (amount * PLATFORM_FEE_PERCENT) / BigInt(100);

  await tx.ledgerEntry.create({
    data: {
      userId: order.sellerId,
      orderId: order.id,
      paymentId: hold.paymentId ?? undefined,
      idempotencyKey: `escrow-release:${order.id}`,
      kind: "ESCROW_RELEASE",
      direction: "CREDIT",
      amountMinor: amount,
      currency: hold.currency,
    },
  });

  if (fee > BigInt(0)) {
    await tx.ledgerEntry.create({
      data: {
        userId: order.sellerId,
        orderId: order.id,
        paymentId: hold.paymentId ?? undefined,
        idempotencyKey: `platform-fee:${order.id}`,
        kind: "PLATFORM_FEE",
        direction: "DEBIT",
        amountMinor: fee,
        currency: hold.currency,
      },
    });
  }

  return true;
}
