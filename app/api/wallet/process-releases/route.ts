import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { releaseEscrowForOrder } from "@/lib/wallet/escrow";

export async function POST() {
  try {
    const userId = await requireVerifiedUser();

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
      if (
        !entry.order ||
        !["COMPLETED", "DELIVERED"].includes(entry.order.status)
      ) {
        continue;
      }

      const released = await prisma.$transaction((tx) =>
        releaseEscrowForOrder(tx, {
          id: entry.order!.id,
          sellerId: entry.order!.sellerId,
          totalMinor: entry.order!.totalMinor,
          currency: entry.order!.currency,
        }),
      );

      if (released) releases.push(entry.order.id);
    }

    return NextResponse.json({
      message: "Escrow releases processed",
      processed: releases.length,
    });
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
