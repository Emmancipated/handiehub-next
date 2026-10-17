import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  try {
    const userId = await requireUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (!user || !user.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Only admins can process releases" },
        { status: 403 },
      );
    }

    // Find all ESCROW_HOLD debit entries
    const heldEntries = await prisma.ledgerEntry.findMany({
      where: {
        kind: "ESCROW_HOLD",
        direction: "DEBIT",
      },
      include: { order: true },
    });

    const releases: string[] = [];

    for (const entry of heldEntries) {
      if (!entry.order || entry.order.status !== "DELIVERED") continue;

      // Skip if already released
      const alreadyReleased = await prisma.ledgerEntry.findFirst({
        where: { orderId: entry.orderId, kind: "ESCROW_RELEASE" },
      });
      if (alreadyReleased) continue;

      const order = entry.order;

      await prisma.$transaction([
        prisma.ledgerEntry.create({
          data: {
            userId: order.sellerId,
            orderId: order.id,
            paymentId: entry.paymentId ?? undefined,
            idempotencyKey: `release-${order.id}-${Date.now()}`,
            kind: "ESCROW_RELEASE",
            direction: "CREDIT",
            amountMinor: order.totalMinor,
            currency: order.currency,
          },
        }),
        prisma.ledgerEntry.create({
          data: {
            userId,
            orderId: order.id,
            paymentId: entry.paymentId ?? undefined,
            idempotencyKey: `platform-fee-${order.id}-${Date.now()}`,
            kind: "PLATFORM_FEE",
            direction: "DEBIT",
            amountMinor: BigInt(Math.floor(Number(order.totalMinor) * 0.05)),
            currency: order.currency,
          },
        }),
      ]);

      releases.push(order.id);
    }

    return NextResponse.json({
      message: "Escrow releases processed",
      processed: releases.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
