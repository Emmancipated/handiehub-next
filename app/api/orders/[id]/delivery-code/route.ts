import { NextResponse } from "next/server";
import { requireVerifiedUser, AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import {
  DELIVERY_CODE_MAX_ATTEMPTS,
  deliveryCodeExpiry,
  generateDeliveryCode,
} from "@/lib/orders/delivery-code";

/**
 * The buyer's delivery code. It is shown only to the buyer and is the secret
 * the seller/courier presents to complete the order and release escrow.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireVerifiedUser();
    const { id } = await params;
    const refresh = new URL(req.url).searchParams.get("refresh") === "1";

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        buyerId: true,
        status: true,
        deliveryCode: true,
        deliveryCodeExpiresAt: true,
        deliveryCodeAttempts: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.buyerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (order.status === "PENDING_PAYMENT") {
      return NextResponse.json(
        {
          error: "Your delivery code is available after payment.",
          code: "ORDER_NOT_PAID",
        },
        { status: 409 },
      );
    }
    if (["CANCELLED", "REFUNDED", "COMPLETED"].includes(order.status)) {
      return NextResponse.json(
        { error: "This order no longer has a delivery code" },
        { status: 409 },
      );
    }

    if (
      refresh ||
      !order.deliveryCode ||
      !order.deliveryCodeExpiresAt ||
      order.deliveryCodeExpiresAt.getTime() <= Date.now() ||
      order.deliveryCodeAttempts >= DELIVERY_CODE_MAX_ATTEMPTS
    ) {
      const code = generateDeliveryCode();
      const expiresAt = deliveryCodeExpiry();
      await prisma.order.update({
        where: { id },
        data: {
          deliveryCode: code,
          deliveryCodeExpiresAt: expiresAt,
          deliveryCodeAttempts: 0,
        },
      });
      return NextResponse.json({ code, expiresAt });
    }

    return NextResponse.json({
      code: order.deliveryCode,
      expiresAt: order.deliveryCodeExpiresAt,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error("Delivery code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
