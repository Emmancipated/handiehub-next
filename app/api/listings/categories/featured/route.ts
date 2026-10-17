import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const featuredQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(req: Request) {
  try {
    await requireUserId();

    const { searchParams } = new URL(req.url);
    const parsed = featuredQuerySchema.parse({
      limit: searchParams.get("limit"),
    });

    const { limit } = parsed;

    const categories = await prisma.category.findMany({
      where: {
        listings: {
          some: { status: "ACTIVE" },
        },
      },
      orderBy: {
        listings: {
          _count: "desc",
        },
      },
      take: limit,
      include: {
        _count: {
          select: { listings: { where: { status: "ACTIVE" } } },
        },
      },
    });

    return NextResponse.json({ categories });
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
