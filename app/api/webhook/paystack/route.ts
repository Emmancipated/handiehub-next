import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifySignature } from "@/lib/paystack/paystack";

export async function POST(req: Request) {
  const signature = req.headers.get("x-paystack-signature");

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 },
    );
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType = event.event;
  const data = event.data;

  if (typeof eventType !== "string" || !data || typeof data !== "object") {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  try {
    if (eventType === "charge.success") {
      const reference = (data as { reference?: string }).reference;
      const payment = await prisma.payment.findUnique({
        where: { providerReference: reference },
      });

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      if (payment.status === "SUCCEEDED") {
        return NextResponse.json({ received: true }); // Idempotent: already processed
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          verifiedAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID" },
      });
    } else if (eventType === "charge.failed") {
      const reference = (data as { reference?: string }).reference;
      const payment = await prisma.payment.findUnique({
        where: { providerReference: reference },
      });

      if (payment && payment.status !== "FAILED") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
