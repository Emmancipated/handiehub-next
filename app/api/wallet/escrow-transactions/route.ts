import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const escrowQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().nullable(),
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
        { error: "Only sellers can access escrow transactions" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = escrowQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.get("status"),
    });

    const { page, limit } = parsed;

    const where: Record<string, unknown> = {
      userId,
      kind: { in: ["ESCROW_HOLD", "ESCROW_RELEASE"] },
    };

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: { select: { id: true, orderNumber: true, status: true } },
          payment: { select: { id: true, status: true } },
        },
      }),
      prisma.ledgerEntry.count({ where }),
    ]);

    const serialized = entries.map((e) => ({
      ...e,
      amountMinor: e.amountMinor.toString(),
    }));

    return NextResponse.json({
      transactions: serialized,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
