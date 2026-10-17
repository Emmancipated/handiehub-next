import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { initializePayment, PaystackError } from "@/lib/paystack/paystack";
import { z } from "zod";

const initializeSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

    const body = await req.json();
    const data = initializeSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true,
        totalMinor: true,
        currency: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.buyerId !== userId) {
      return NextResponse.json(
        { error: "Only the buyer can initialize payment" },
        { status: 403 },
      );
    }

    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Order is not pending payment" },
        { status: 400 },
      );
    }

    const idempotencyKey = `pay-${order.id}-${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId,
        provider: "paystack",
        idempotencyKey,
        status: "INITIATED",
        amountMinor: order.totalMinor,
        currency: order.currency,
      },
    });

    const paystack = await initializePayment({
      email: "", // Will be filled from user profile in production
      amount: Number(order.totalMinor),
      reference: idempotencyKey,
      metadata: {
        orderId: order.id,
        paymentId: payment.id,
        userId,
      },
    });

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerReference: paystack.data?.reference ?? null,
      },
      select: {
        id: true,
        providerReference: true,
        status: true,
        amountMinor: true,
        currency: true,
      },
    });

    return NextResponse.json({
      payment: updatedPayment,
      authorizationUrl: paystack.data?.authorization_url ?? null,
      accessCode: paystack.data?.access_code ?? null,
      reference: paystack.data?.reference ?? null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof PaystackError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
