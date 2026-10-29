import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const sellerId = await requireUserId();

    const user = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { roles: true },
    });
    if (!user || !user.roles.includes("SELLER")) {
      return NextResponse.json(
        { error: "Only sellers can access overview stats" },
        { status: 403 },
      );
    }

    const totalOrders = await prisma.order.count({ where: { sellerId } });
    const completedOrders = await prisma.order.count({
      where: { sellerId, status: "DELIVERED" },
    });
    const pendingOrders = await prisma.order.count({
      where: { sellerId, status: { in: ["PENDING_PAYMENT", "PAID", "ACCEPTED", "IN_PROGRESS"] } },
    });

    const revenueAgg = await prisma.order.aggregate({
      where: { sellerId, status: "DELIVERED" },
      _sum: { totalMinor: true },
    });

    const totalRevenue =
      typeof revenueAgg._sum.totalMinor === "bigint"
        ? revenueAgg._sum.totalMinor.toString()
        : "0";

    const reviewsReceived = await prisma.review.count({ where: { sellerId } });

    const ratingAgg = await prisma.review.aggregate({
      where: { sellerId },
      _avg: { rating: true },
    });

    const averageRating =
      ratingAgg._avg.rating !== null ? Math.round(ratingAgg._avg.rating * 10) / 10 : 0;

    return NextResponse.json({
      stats: {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue,
        reviewsReceived,
        averageRating,
      },
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
