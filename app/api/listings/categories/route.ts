import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const categoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    await requireUserId();

    const { searchParams } = new URL(req.url);
    const parsed = categoryQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const { page, limit } = parsed;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { listings: true } },
        },
      }),
      prisma.category.count(),
    ]);

    return NextResponse.json({
      categories,
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
