import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { serializeSellerProfile } from "@/lib/seller/profile";

/**
 * Public seller profile. Authentication is not required to browse a seller's
 * storefront (parity with the trusted Nest build's public reads).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const seller = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        roles: true,
        createdAt: true,
        sellerProfile: true,
        listings: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 24,
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            kind: true,
            priceMinor: true,
            currency: true,
            images: true,
            createdAt: true,
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!seller || !seller.roles.includes("SELLER")) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 },
      );
    }

    const [ratingAgg, listingCount] = await Promise.all([
      prisma.review.aggregate({
        where: { sellerId: seller.id },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.listing.count({
        where: { sellerId: seller.id, status: "ACTIVE" },
      }),
    ]);

    const reviewCount = ratingAgg._count._all;
    const averageRating =
      reviewCount > 0 && ratingAgg._avg.rating != null
        ? Number(ratingAgg._avg.rating.toFixed(2))
        : null;

    return NextResponse.json({
      seller: {
        id: seller.id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        memberSince: seller.createdAt,
        profile: seller.sellerProfile
          ? serializeSellerProfile(seller.sellerProfile)
          : null,
        listings: seller.listings.map((listing) => ({
          ...listing,
          priceMinor: listing.priceMinor.toString(),
        })),
        stats: {
          listingCount,
          reviewCount,
          averageRating,
        },
      },
    });
  } catch (error) {
    console.error("Get seller error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
