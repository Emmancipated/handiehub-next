import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifySignature } from "@/lib/paystack/paystack";
import { settleSuccessfulPayment } from "@/lib/payments/settle";

type PaystackWebhookEvent = {
  event: string;
  data: {
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
  };
};

/**
 * Canonical Paystack webhook (mounted at `/api/webhook/paystack`, the URL the
 * trusted Nest build used). Middleware treats this path as public; the request
 * is authenticated by Paystack's HMAC signature instead of a session cookie.
 */
export async function POST(req: Request) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { error: "Paystack not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("x-paystack-signature");
  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const reference = event?.data?.reference;
  if (typeof event?.event !== "string" || typeof reference !== "string") {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  try {
    if (event.event === "charge.success") {
      const payment = await prisma.payment.findUnique({
        where: { providerReference: reference },
        include: { order: true },
      });

      if (!payment) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 },
        );
      }

      // Idempotent: Paystack retries until it receives a 200.
      if (payment.status === "SUCCEEDED") {
        return NextResponse.json({ received: true });
      }

      const amountMinor =
        typeof event.data.amount === "number"
          ? BigInt(event.data.amount)
          : payment.amountMinor;
      const currency = event.data.currency ?? payment.currency;

      const settlement = await settleSuccessfulPayment({
        paymentId: payment.id,
        providerAmountMinor: amountMinor,
        providerCurrency: currency,
        reference,
      });

      if (
        settlement.status === "amount_mismatch" ||
        settlement.status === "currency_mismatch" ||
        settlement.status === "order_not_pending"
      ) {
        console.error("Paystack settlement mismatch", {
          reference,
          settlement,
        });
      }

      return NextResponse.json({ received: true });
    }

    if (event.event === "charge.failed") {
      const payment = await prisma.payment.findUnique({
        where: { providerReference: reference },
      });

      if (
        payment &&
        !["SUCCEEDED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(
          payment.status,
        )
      ) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
      }

      return NextResponse.json({ received: true });
    }

    // Acknowledge unhandled event types so Paystack stops retrying them.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
