import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSeller = user.roles.includes("SELLER");

    const buyerOrdersCount = await prisma.order.count({
      where: { buyerId: userId, status: { not: "CANCELLED" } },
    });

    const completedBuyerOrders = await prisma.order.count({
      where: { buyerId: userId, status: "DELIVERED" },
    });

    const reviewsWritten = await prisma.review.count({
      where: { authorId: userId },
    });

    const stats: Record<string, unknown> = {
      orders: buyerOrdersCount,
      completedOrders: completedBuyerOrders,
      reviewsWritten,
    };

    if (isSeller) {
      const sellerOrdersCount = await prisma.order.count({
        where: { sellerId: userId, status: { not: "CANCELLED" } },
      });

      const completedSellerOrders = await prisma.order.count({
        where: { sellerId: userId, status: "DELIVERED" },
      });

      const reviewsReceived = await prisma.review.count({
        where: { sellerId: userId },
      });

      const ratingAgg = await prisma.review.aggregate({
        where: { sellerId: userId },
        _avg: { rating: true },
        _count: true,
      });

      const avgRating =
        ratingAgg._avg.rating !== null ? Math.round(ratingAgg._avg.rating * 10) / 10 : 0;

      const revenueAgg = await prisma.order.aggregate({
        where: { sellerId: userId, status: "DELIVERED" },
        _sum: { totalMinor: true },
      });

      const totalRevenue =
        typeof revenueAgg._sum.totalMinor === "bigint"
          ? revenueAgg._sum.totalMinor.toString()
          : "0";

      stats.sellerStats = {
        totalOrders: sellerOrdersCount,
        completedOrders: completedSellerOrders,
        reviewsReceived,
        averageRating: avgRating,
        totalRevenue,
      };
    }

    return NextResponse.json({ stats });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
