import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const savedSchema = z.object({
  listingId: z.string().min(1),
});

/** List the signed-in user's saved listings, newest first. */
export async function GET() {
  try {
    const userId = await requireUserId();

    const saved = await prisma.savedListing.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            seller: {
              select: { id: true, firstName: true, lastName: true },
            },
            _count: { select: { reviews: true } },
          },
        },
      },
    });

    return NextResponse.json({
      saved: saved.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        listing: {
          ...row.listing,
          reviewCount: row.listing._count.reviews,
          _count: undefined,
        },
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Save a listing. Idempotent: saving twice keeps one row. */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { listingId } = savedSchema.parse(await req.json());

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true },
    });
    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Listing not available" }, { status: 404 });
    }

    await prisma.savedListing.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId },
      update: {},
    });

    return NextResponse.json({ saved: true });
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

/** Remove a listing from the wishlist. */
export async function DELETE(req: Request) {
  try {
    const userId = await requireUserId();
    const { listingId } = savedSchema.parse(await req.json());

    await prisma.savedListing.deleteMany({ where: { userId, listingId } });

    return NextResponse.json({ saved: false });
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
