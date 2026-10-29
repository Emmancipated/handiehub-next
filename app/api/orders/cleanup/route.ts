import { NextResponse } from "next/server";
import { requireVerifiedUser, AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { restoreReservedStock } from "@/lib/orders/stock";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

async function isAuthorized(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`) {
    return true;
  }

  try {
    const userId = await requireVerifiedUser();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    return Boolean(user?.roles.includes("ADMIN"));
  } catch (error) {
    if (error instanceof AuthError) return false;
    throw error;
  }
}

/**
 * Cancel abandoned checkout reservations so stock is not held forever.
 * Safe to run repeatedly: the conditional status update claims each order
 * once, and stock is restored in the same transaction. Runs as a cron with
 * `Authorization: Bearer $CRON_SECRET` or manually as an admin.
 */
async function cleanup(req: Request) {
  try {
    if (!(await isAuthorized(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - STALE_AFTER_MS);
    const staleOrders = await prisma.order.findMany({
      where: { status: "PENDING_PAYMENT", createdAt: { lt: cutoff } },
      include: {
        items: { select: { listingId: true, quantity: true } },
        payments: { select: { status: true } },
      },
      take: BATCH_SIZE,
      orderBy: { createdAt: "asc" },
    });

    let cancelled = 0;

    for (const order of staleOrders) {
      // A succeeded payment may be waiting for the webhook/verification path.
      // Never cancel those here; settlement will move them to PAID.
      if (order.payments.some((payment) => payment.status === "SUCCEEDED")) {
        continue;
      }

      const claimed = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING_PAYMENT" },
          data: {
            status: "CANCELLED",
            deliveryCode: null,
            deliveryCodeExpiresAt: null,
          },
        });

        if (updated.count === 0) return false;

        await restoreReservedStock(tx, order.items);
        return true;
      });

      if (claimed) cancelled += 1;
    }

    return NextResponse.json({
      scanned: staleOrders.length,
      cancelled,
    });
  } catch (error) {
    console.error("Order cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return cleanup(req);
}

export async function POST(req: Request) {
  return cleanup(req);
}
