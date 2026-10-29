import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const categoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

type KindStats = { products: number; services: number };

const emptyStats: KindStats = { products: 0, services: 0 };

const toStats = (stats: KindStats) => ({
  listings: stats.products + stats.services,
  products: stats.products,
  services: stats.services,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = categoryQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const { page, limit } = parsed;

    // Only top-level categories are paginated; their subcategories always
    // travel with them so the UI can render the full tree from one request.
    const [categories, total, kindGroups] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          children: {
            orderBy: { name: "asc" },
            select: { id: true, slug: true, name: true, parentId: true },
          },
        },
      }),
      prisma.category.count({ where: { parentId: null } }),
      prisma.listing.groupBy({
        by: ["categoryId", "kind"],
        where: { status: "ACTIVE" },
        _count: { _all: true },
      }),
    ]);

    const statsByCategory = new Map<string, KindStats>();
    for (const group of kindGroups) {
      const stats = statsByCategory.get(group.categoryId) ?? { ...emptyStats };
      if (group.kind === "PRODUCT") stats.products = group._count._all;
      if (group.kind === "SERVICE") stats.services = group._count._all;
      statsByCategory.set(group.categoryId, stats);
    }

    const data = categories.map((category) => {
      const own = statsByCategory.get(category.id) ?? emptyStats;

      const children = category.children.map((child) => {
        const childStats = statsByCategory.get(child.id) ?? emptyStats;
        return { ...child, stats: toStats(childStats) };
      });

      // A parent's totals include everything filed under its subcategories,
      // so the directory reflects the whole branch, not just direct listings.
      const products =
        own.products +
        children.reduce((sum, child) => sum + child.stats.products, 0);
      const services =
        own.services +
        children.reduce((sum, child) => sum + child.stats.services, 0);

      return {
        ...category,
        children,
        stats: toStats({ products, services }),
      };
    });

    return NextResponse.json({
      categories: data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
