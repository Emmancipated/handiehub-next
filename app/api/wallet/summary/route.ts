import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSeller = user.roles.includes("SELLER");

    const [creditAgg, debitAgg] = await Promise.all([
      prisma.ledgerEntry.aggregate({
        where: { userId, direction: "CREDIT" },
        _sum: { amountMinor: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { userId, direction: "DEBIT" },
        _sum: { amountMinor: true },
      }),
    ]);

    const creditTotal =
      typeof creditAgg._sum.amountMinor === "bigint"
        ? creditAgg._sum.amountMinor.toString()
        : "0";
    const debitTotal =
      typeof debitAgg._sum.amountMinor === "bigint"
        ? debitAgg._sum.amountMinor.toString()
        : "0";
    const availableBalance = BigInt(creditTotal) - BigInt(debitTotal);

    const buyerOrdersCount = await prisma.order.count({
      where: { buyerId: userId, status: { not: "CANCELLED" } },
    });
    const completedBuyerOrders = await prisma.order.count({
      where: { buyerId: userId, status: "DELIVERED" },
    });

    const summary: Record<string, unknown> = {
      availableBalance: availableBalance.toString(),
      currency: "NGN",
      buyerOrders: buyerOrdersCount,
      completedBuyerOrders,
    };

    if (isSeller) {
      const sellerOrdersCount = await prisma.order.count({
        where: { sellerId: userId, status: { not: "CANCELLED" } },
      });
      const completedSellerOrders = await prisma.order.count({
        where: { sellerId: userId, status: "DELIVERED" },
      });

      const sellerRevenueAgg = await prisma.order.aggregate({
        where: { sellerId: userId, status: "DELIVERED" },
        _sum: { totalMinor: true },
      });
      const sellerRevenue =
        typeof sellerRevenueAgg._sum.totalMinor === "bigint"
          ? sellerRevenueAgg._sum.totalMinor.toString()
          : "0";

      summary.sellerSummary = {
        totalOrders: sellerOrdersCount,
        completedOrders: completedSellerOrders,
        totalRevenue: sellerRevenue,
      };
    }

    return NextResponse.json({ summary });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
