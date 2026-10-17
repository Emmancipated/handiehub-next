import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const relatedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(4),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUserId();

    const { id } = await params;

    const { searchParams } = new URL(req.url);
    const parsed = relatedQuerySchema.parse({
      limit: searchParams.get("limit"),
    });

    const { limit } = parsed;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, categoryId: true, kind: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const related = await prisma.listing.findMany({
      where: {
        id: { not: id },
        categoryId: listing.categoryId,
        kind: listing.kind,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ related });
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
