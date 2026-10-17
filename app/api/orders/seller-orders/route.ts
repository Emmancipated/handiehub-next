import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const sellerOrdersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
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
  ]).nullable(),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (!user || !user.roles.includes("SELLER")) {
      return NextResponse.json(
        { error: "Only sellers can access seller orders" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = sellerOrdersQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
    });

    const { page, limit, status } = parsed;

    const where: Record<string, unknown> = { sellerId: userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: true,
          buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
          payments: { select: { id: true, status: true, amountMinor: true } },
          review: true,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
