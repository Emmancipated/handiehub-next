import { NextResponse } from "next/server";
import { requireUserId, requireVerifiedUser } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import {
  actorForOrder,
  canTransition,
  isTerminal,
  type OrderStatus,
} from "@/lib/orders/status";
import { releaseEscrowForOrder } from "@/lib/wallet/escrow";
import { restoreReservedStock } from "@/lib/orders/stock";
import { z } from "zod";

const updateOrderSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PAID",
    "ACCEPTED",
    "IN_PROGRESS",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "DISPUTED",
    "REFUNDED",
  ]).optional(),
  deliveryDate: z.coerce.date().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { listing: { select: { id: true, title: true, slug: true, images: true } } },
        },
        payments: true,
        buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
        seller: { select: { id: true, firstName: true, lastName: true, email: true } },
        review: true,
        ledgerEntries: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = user.roles.includes("ADMIN");
    if (!isAdmin && order.buyerId !== userId && order.sellerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireVerifiedUser();

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: { select: { status: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const actor = actorForOrder(userId, user.roles, order);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateOrderSchema.parse(body);

    if (
      data.status === "CANCELLED" &&
      actor === "buyer" &&
      order.payments.some((payment) =>
        ["INITIATED", "SUCCEEDED"].includes(payment.status),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A payment for this order is already in progress. Contact support if you need help.",
          code: "PAYMENT_IN_PROGRESS",
        },
        { status: 409 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) {
      if (!canTransition(actor, order.status as OrderStatus, data.status)) {
        return NextResponse.json(
          {
            error: `The ${actor} cannot move this order from ${order.status} to ${data.status}`,
            code: "INVALID_STATUS_TRANSITION",
          },
          { status: 409 },
        );
      }
      updateData.status = data.status;
    }

    if (data.deliveryDate !== undefined) {
      if (actor === "buyer") {
        return NextResponse.json(
          { error: "Only the seller or an admin can reschedule an order" },
          { status: 403 },
        );
      }
      if (isTerminal(order.status as OrderStatus)) {
        return NextResponse.json(
          { error: "This order can no longer be rescheduled" },
          { status: 409 },
        );
      }
      updateData.serviceSchedule = data.deliveryDate;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    if (
      data.status &&
      ["COMPLETED", "CANCELLED", "REFUNDED"].includes(data.status)
    ) {
      updateData.deliveryCode = null;
      updateData.deliveryCodeExpiresAt = null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          items: true,
          buyer: { select: { id: true, firstName: true, lastName: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (row.status === "COMPLETED") {
        await releaseEscrowForOrder(tx, row);
      }

      if (row.status === "CANCELLED") {
        await restoreReservedStock(tx, row.items);
      }

      return row;
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireVerifiedUser();

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: { select: { id: true, status: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = user.roles.includes("ADMIN");
    if (!isAdmin && order.buyerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (order.status !== "PENDING_PAYMENT" || order.payments.length > 0) {
      return NextResponse.json(
        {
          error:
            "Only unpaid orders can be deleted. Cancel or refund this order instead.",
          code: "ORDER_NOT_DELETABLE",
        },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await restoreReservedStock(tx, order.items);
      await tx.order.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
