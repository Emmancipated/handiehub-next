import { prisma } from "@/lib/db/prisma";
import {
  deliveryCodeExpiry,
  generateDeliveryCode,
} from "@/lib/orders/delivery-code";

export type SettlementResult =
  | { status: "settled" }
  | { status: "already_settled" }
  | { status: "amount_mismatch"; expected: bigint; received: bigint }
  | { status: "currency_mismatch"; expected: string; received: string }
  | { status: "order_not_pending"; orderStatus: string };

/**
 * Apply a successful Paystack charge exactly once: mark the payment, move the
 * order to PAID, mint the buyer's delivery code and record the capture/escrow
 * ledger rows. Both the browser verification path and the webhook call this,
 * so settlement cannot depend on which one arrives first.
 */
export async function settleSuccessfulPayment({
  paymentId,
  providerAmountMinor,
  providerCurrency,
  reference,
}: {
  paymentId: string;
  providerAmountMinor: bigint;
  providerCurrency?: string | null;
  reference: string;
}): Promise<SettlementResult> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status === "SUCCEEDED") {
      return { status: "already_settled" };
    }

    if (providerAmountMinor !== payment.order.totalMinor) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      return {
        status: "amount_mismatch",
        expected: payment.order.totalMinor,
        received: providerAmountMinor,
      };
    }

    const currency = providerCurrency ?? payment.currency;
    if (currency !== payment.order.currency) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      return {
        status: "currency_mismatch",
        expected: payment.order.currency,
        received: currency,
      };
    }

    // A charge can still complete after the order was cancelled (for example,
    // an abandoned Paystack tab). Record the payment, but never resurrect a
    // closed order or hold escrow for it; support must refund manually.
    if (
      ["CANCELLED", "REFUNDED", "COMPLETED"].includes(payment.order.status)
    ) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          verifiedAt: new Date(),
          amountMinor: providerAmountMinor,
          currency,
        },
      });
      return {
        status: "order_not_pending",
        orderStatus: payment.order.status,
      };
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        verifiedAt: new Date(),
        amountMinor: providerAmountMinor,
        currency,
      },
    });

    if (payment.order.status === "PENDING_PAYMENT") {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "PAID",
          deliveryCode: payment.order.deliveryCode ?? generateDeliveryCode(),
          deliveryCodeExpiresAt:
            payment.order.deliveryCodeExpiresAt ?? deliveryCodeExpiry(),
          deliveryCodeAttempts: 0,
        },
      });
    } else if (!payment.order.deliveryCode) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          deliveryCode: generateDeliveryCode(),
          deliveryCodeExpiresAt: deliveryCodeExpiry(),
          deliveryCodeAttempts: 0,
        },
      });
    }

    await tx.ledgerEntry.upsert({
      where: { idempotencyKey: `paystack:capture:${reference}` },
      update: {},
      create: {
        idempotencyKey: `paystack:capture:${reference}`,
        // The seller's ledger owns the captured funds until escrow is released;
        // the hold below earmarks them, so available balance stays 0 in transit.
        userId: payment.order.sellerId,
        orderId: payment.orderId,
        paymentId: payment.id,
        kind: "PAYMENT_CAPTURE",
        direction: "CREDIT",
        amountMinor: providerAmountMinor,
        currency,
      },
    });

    await tx.ledgerEntry.upsert({
      where: { idempotencyKey: `paystack:escrow:${reference}` },
      update: {},
      create: {
        idempotencyKey: `paystack:escrow:${reference}`,
        userId: payment.order.sellerId,
        orderId: payment.orderId,
        paymentId: payment.id,
        kind: "ESCROW_HOLD",
        direction: "DEBIT",
        amountMinor: providerAmountMinor,
        currency,
      },
    });

    return { status: "settled" };
  });
}
