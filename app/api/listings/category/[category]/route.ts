import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { toJsonPayload } from "@/lib/http/toJsonPayload";
import {
  getListingRatings,
  listingOrderBy,
  withListingRatings,
} from "@/lib/listing/query";

const categoryListingsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  kind: z.enum(["PRODUCT", "SERVICE"]).nullable(),
  sort: z.enum(["newest", "price-asc", "price-desc", "rating"]).default("newest"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ category: string }> },
) {
  try {
    const { category } = await params;

    const { searchParams } = new URL(req.url);
    const parsed = categoryListingsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      kind: searchParams.get("kind"),
      sort: searchParams.get("sort") ?? undefined,
    });

    const { page, limit, kind, sort } = parsed;

    const categoryRecord = await prisma.category.findUnique({
      where: { slug: category },
      include: {
        parent: { select: { id: true, slug: true, name: true } },
        children: {
          orderBy: { name: "asc" },
          select: { id: true, slug: true, name: true },
        },
      },
    });
    if (!categoryRecord) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Browsing a top-level category also surfaces everything filed under its
    // subcategories; browsing a subcategory is scoped to just that branch.
    const categoryIds = [
      categoryRecord.id,
      ...categoryRecord.children.map((child) => child.id),
    ];

    const where: Record<string, unknown> = {
      categoryId: { in: categoryIds },
      status: "ACTIVE",
    };
    if (kind) where.kind = kind;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: listingOrderBy(sort),
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    const ratings = await getListingRatings(listings.map((listing) => listing.id));

    return NextResponse.json(
      toJsonPayload({
        category: categoryRecord,
        listings: withListingRatings(listings, ratings),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }),
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
