import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const ordersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().nullable(),
  buyerId: z.string().nullable(),
  sellerId: z.string().nullable(),
});

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

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const authErr = await requireAdmin(userId);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const parsed = ordersQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
      buyerId: searchParams.get("buyerId"),
      sellerId: searchParams.get("sellerId"),
    });

    const { page, limit, status, buyerId, sellerId } = parsed;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (buyerId) where.buyerId = buyerId;
    if (sellerId) where.sellerId = sellerId;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: true,
          buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
