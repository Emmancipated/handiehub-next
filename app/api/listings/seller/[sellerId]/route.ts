import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const sellerListingsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sellerId: string }> },
) {
  try {
    await requireUserId();

    const { sellerId } = await params;

    const { searchParams } = new URL(req.url);
    const parsed = sellerListingsQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const { page, limit } = parsed;

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, firstName: true, lastName: true, email: true, roles: true },
    });
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = {
      sellerId,
      status: "ACTIVE",
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      seller,
      listings,
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
