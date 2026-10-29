import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const featuredQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = featuredQuerySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
    });

    const { limit } = parsed;

    const [categories, kindGroups] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: { select: { id: true, slug: true, name: true } },
        },
      }),
      prisma.listing.groupBy({
        by: ["categoryId"],
        where: { status: "ACTIVE" },
        _count: { _all: true },
      }),
    ]);

    const counts = new Map<string, number>();
    for (const group of kindGroups) {
      counts.set(group.categoryId, group._count._all);
    }

    const data = categories
      .map((category) => {
        const listings =
          (counts.get(category.id) ?? 0) +
          category.children.reduce(
            (sum, child) => sum + (counts.get(child.id) ?? 0),
            0,
          );
        return { ...category, _count: { listings } };
      })
      .filter((category) => category._count.listings > 0)
      .sort((a, b) => b._count.listings - a._count.listings)
      .slice(0, limit);

    return NextResponse.json({ categories: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
