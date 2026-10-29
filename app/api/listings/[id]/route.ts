import { NextResponse } from "next/server";
import { getOptionalUserId, requireVerifiedUser } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { uniqueSlug } from "@/lib/listing/slug";
import { isSellerProfileComplete } from "@/lib/seller/profile";
import { toJsonPayload } from "@/lib/http/toJsonPayload";
import { getListingRatings, withListingRatings } from "@/lib/listing/query";

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
    // Public read. A session only matters for viewing non-active listings.
    const userId = await getOptionalUserId();

    const { id } = await params;

    const listing = await prisma.listing.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "ACTIVE") {
      // Drafts/rejected listings are only visible to their owner or an admin.
      let allowed = false;
      if (userId) {
        if (listing.sellerId === userId) {
          allowed = true;
        } else {
          const roles =
            (
              await prisma.user.findUnique({
                where: { id: userId },
                select: { roles: true },
              })
            )?.roles ?? [];
          allowed = roles.includes("ADMIN");
        }
      }
      if (!allowed) {
        return NextResponse.json(
          { error: "Listing not found" },
          { status: 404 },
        );
      }
    }

    const ratings = await getListingRatings([listing.id]);
    const [listingWithRating] = withListingRatings([listing], ratings);

    return NextResponse.json(toJsonPayload({ listing: listingWithRating }));
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireVerifiedUser();

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

    // A seller cannot publish (or submit for review) until onboarding is done.
    if (
      existing.sellerId === userId &&
      (data.status === "ACTIVE" || data.status === "PENDING_REVIEW")
    ) {
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
        select: {
          businessName: true,
          phoneNumber: true,
          country: true,
          state: true,
          city: true,
          address: true,
          professions: true,
          skills: true,
        },
      });
      if (!isSellerProfileComplete(sellerProfile)) {
        return NextResponse.json(
          {
            error: "Complete your seller profile before publishing listings",
            code: "SELLER_PROFILE_INCOMPLETE",
          },
          { status: 403 },
        );
      }
    }

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
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
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
    const userId = await requireVerifiedUser();

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
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
