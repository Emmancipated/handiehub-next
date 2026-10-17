import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const searchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  kind: z.enum(["PRODUCT", "SERVICE"]).nullable(),
  category: z.string().nullable(),
});

export async function GET(req: Request) {
  try {
    await requireUserId();

    const { searchParams } = new URL(req.url);
    const parsed = searchQuerySchema.parse({
      q: searchParams.get("q"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      kind: searchParams.get("kind"),
      category: searchParams.get("category"),
    });

    const { q, page, limit, kind, category } = parsed;

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    };

    if (kind) where.kind = kind;
    if (category) where.categoryId = category;

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
      listings,
      query: q,
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
