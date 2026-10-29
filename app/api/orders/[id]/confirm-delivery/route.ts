import { NextResponse } from "next/server";
import { requireVerifiedUser, AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import {
  DELIVERY_CODE_MAX_ATTEMPTS,
} from "@/lib/orders/delivery-code";
import { releaseEscrowForOrder } from "@/lib/wallet/escrow";
import { z } from "zod";

const confirmDeliverySchema = z.object({
  code: z.string().regex(/^\d{6}$/).optional(),
  force: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireVerifiedUser();
    const { id } = await params;
    const data = confirmDeliverySchema.parse(await req.json());

    const [order, user] = await Promise.all([
      prisma.order.findUnique({ where: { id } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      }),
    ]);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = user.roles.includes("ADMIN");
    if (!isAdmin && order.sellerId !== userId) {
      return NextResponse.json(
        { error: "Only the seller can confirm delivery" },
        { status: 403 },
      );
    }

    if (!["IN_PROGRESS", "SHIPPED", "DELIVERED"].includes(order.status)) {
      return NextResponse.json(
        { error: "Order is not in a deliverable state" },
        { status: 400 },
      );
    }

    const adminOverride = isAdmin && data.force === true;

    if (!adminOverride) {
      if (
        !order.deliveryCode ||
        !order.deliveryCodeExpiresAt ||
        order.deliveryCodeExpiresAt.getTime() <= Date.now()
      ) {
        return NextResponse.json(
          {
            error: "The delivery code has expired. Ask the buyer for a new one.",
            code: "DELIVERY_CODE_EXPIRED",
          },
          { status: 400 },
        );
      }

      if (order.deliveryCodeAttempts >= DELIVERY_CODE_MAX_ATTEMPTS) {
        return NextResponse.json(
          {
            error: "Too many incorrect attempts. Ask the buyer to regenerate.",
            code: "DELIVERY_CODE_LOCKED",
          },
          { status: 429 },
        );
      }

      if (!data.code || data.code !== order.deliveryCode) {
        await prisma.order.update({
          where: { id },
          data: { deliveryCodeAttempts: { increment: 1 } },
        });
        return NextResponse.json(
          { error: "Incorrect delivery code", code: "DELIVERY_CODE_INVALID" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.order.update({
        where: { id },
        data: {
          status: "COMPLETED",
          deliveryCode: null,
          deliveryCodeExpiresAt: null,
          deliveryCodeAttempts: 0,
        },
        include: {
          buyer: { select: { id: true, firstName: true, lastName: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await releaseEscrowForOrder(tx, row);
      return row;
    });

    return NextResponse.json({ order: updated, message: "Delivery confirmed" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("Confirm delivery error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

