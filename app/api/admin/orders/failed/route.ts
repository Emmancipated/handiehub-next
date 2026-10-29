import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const adminQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
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
    const parsed = adminQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const { page, limit } = parsed;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          payments: {
            some: { status: "FAILED" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
          payments: true,
        },
      }),
      prisma.order.count({
        where: {
          payments: {
            some: { status: "FAILED" },
          },
        },
      }),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
