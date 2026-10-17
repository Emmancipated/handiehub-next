import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const categoryListingsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  kind: z.enum(["PRODUCT", "SERVICE"]).nullable(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ category: string }> },
) {
  try {
    await requireUserId();

    const { category } = await params;

    const { searchParams } = new URL(req.url);
    const parsed = categoryListingsQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      kind: searchParams.get("kind"),
    });

    const { page, limit, kind } = parsed;

    const categoryRecord = await prisma.category.findUnique({
      where: { slug: category },
    });
    if (!categoryRecord) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = {
      categoryId: categoryRecord.id,
      status: "ACTIVE",
    };
    if (kind) where.kind = kind;

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
      category: categoryRecord,
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
