import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/** Reviews written by the signed-in user. */
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const { page, limit } = querySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const where = { authorId: userId };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          listing: { select: { id: true, title: true, slug: true, images: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
          order: { select: { orderNumber: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
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
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
