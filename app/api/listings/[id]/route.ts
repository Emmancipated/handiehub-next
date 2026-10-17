import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { uniqueSlug } from "@/lib/listing/slug";

const updateListingSchema = z.object({
  title: z.string().min(1).max(180).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  kind: z.enum(["PRODUCT", "SERVICE"]).optional(),
  priceMinor: z.string().optional(),
  currency: z.string().length(3).optional(),
  stockOnHand: z.coerce.number().int().nonnegative().optional().nullable(),
  serviceDurationMins: z.coerce.number().int().positive().optional().nullable(),
  serviceArea: z.string().optional().nullable(),
  images: z.array(z.string().url()).optional(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "REJECTED", "ARCHIVED"]).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUserId();

    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();

    const { id } = await params;

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existing.sellerId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });
      if (!user || !user.roles.includes("ADMIN")) {
        return NextResponse.json(
          { error: "You can only update your own listings" },
          { status: 403 },
        );
      }
    }

    const body = await req.json();
    const data = updateListingSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };

    if (data.title !== undefined && data.title !== existing.title) {
      updateData.slug = await uniqueSlug(data.title, { excludeId: id });
    }

    if (data.priceMinor !== undefined) {
      updateData.priceMinor = BigInt(data.priceMinor);
    }

    if (data.attributes !== undefined) {
      updateData.attributes = data.attributes;
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ listing });
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();

    const { id } = await params;

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existing.sellerId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });
      if (!user || !user.roles.includes("ADMIN")) {
        return NextResponse.json(
          { error: "You can only delete your own listings" },
          { status: 403 },
        );
      }
    }

    await prisma.listing.delete({ where: { id } });

    return NextResponse.json({ message: "Listing deleted successfully" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
