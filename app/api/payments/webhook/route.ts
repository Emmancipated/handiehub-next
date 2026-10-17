import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifySignature, PaystackError } from "@/lib/paystack/paystack";

type PaystackWebhookEvent = {
  event: string;
  data: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
  };
};

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-paystack-signature");
    const rawBody = await req.text();

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as PaystackWebhookEvent;
    const { event: eventType, data } = event;

    if (eventType === "charge.success") {
      const { reference, amount, currency } = data;

      const payment = await prisma.payment.findUnique({
        where: { providerReference: reference },
        include: { order: true },
      });

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      if (payment.status === "SUCCEEDED") {
        return NextResponse.json({ received: true });
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCEEDED",
            verifiedAt: new Date(),
            amountMinor: BigInt(amount),
            currency,
          },
        });

        if (payment.order.status === "PENDING_PAYMENT") {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "PAID" },
          });
        }

        await tx.ledgerEntry.create({
          data: {
            idempotencyKey: `webhook-${reference}-${Date.now()}`,
            userId: payment.userId,
            orderId: payment.orderId,
            paymentId: payment.id,
            kind: "PAYMENT_CAPTURE",
            direction: "CREDIT",
            amountMinor: payment.amountMinor,
            currency: payment.currency,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            idempotencyKey: `escrow-${reference}-${Date.now()}`,
            userId: payment.order.sellerId,
            orderId: payment.orderId,
            paymentId: payment.id,
            kind: "ESCROW_HOLD",
            direction: "DEBIT",
            amountMinor: payment.amountMinor,
            currency: payment.currency,
          },
        });
      });

      return NextResponse.json({ received: true });
    }

    if (eventType === "charge.failed") {
      const { reference } = data;

      const payment = await prisma.payment.findUnique({
        where: { providerReference: reference },
      });

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof PaystackError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
