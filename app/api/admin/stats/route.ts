import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

async function requireAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  if (!user || !user.roles.includes("ADMIN")) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }
  return null;
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const authErr = await requireAdmin(userId);
    if (authErr) return authErr;

    const [
      totalUsers,
      totalSellers,
      totalListings,
      activeListings,
      totalOrders,
      completedOrders,
      totalRevenueAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { roles: { has: "SELLER" } } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.aggregate({
        where: { status: "DELIVERED" },
        _sum: { totalMinor: true },
      }),
    ]);

    const totalRevenue =
      typeof totalRevenueAgg._sum.totalMinor === "bigint"
        ? totalRevenueAgg._sum.totalMinor.toString()
        : "0";

    return NextResponse.json({
      stats: {
        totalUsers,
        totalSellers,
        totalListings,
        activeListings,
        totalOrders,
        completedOrders,
        totalRevenue,
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
