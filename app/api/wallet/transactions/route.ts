import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const walletHistorySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  kind: z.enum([
    "PAYMENT_CAPTURE",
    "ESCROW_HOLD",
    "ESCROW_RELEASE",
    "REFUND",
    "PLATFORM_FEE",
    "PAYOUT",
    "ADJUSTMENT",
  ]).nullable(),
  direction: z.enum(["CREDIT", "DEBIT"]).nullable(),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const { searchParams } = new URL(req.url);
    const parsed = walletHistorySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      kind: searchParams.get("kind"),
      direction: searchParams.get("direction"),
    });

    const { page, limit, kind, direction } = parsed;

    const where: Record<string, unknown> = { userId };
    if (kind) where.kind = kind;
    if (direction) where.direction = direction;

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: { select: { id: true, orderNumber: true, status: true } },
          payment: { select: { id: true, provider: true, status: true } },
        },
      }),
      prisma.ledgerEntry.count({ where }),
    ]);

    // Convert BigInt fields to strings for JSON serialization
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
