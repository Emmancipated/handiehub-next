import { NextResponse } from "next/server";
import { getOptionalUserId, requireVerifiedUser } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { uniqueSlug } from "@/lib/listing/slug";
import { isSellerProfileComplete } from "@/lib/seller/profile";
import { toJsonPayload } from "@/lib/http/toJsonPayload";
import {
  getListingRatings,
  listingOrderBy,
  withListingRatings,
} from "@/lib/listing/query";

const listingQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().nullable(),
  kind: z.enum(["PRODUCT", "SERVICE"]).nullable(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "REJECTED", "ARCHIVED"]).nullable(),
  sellerId: z.string().nullable(),
  q: z.string().nullable(),
  sort: z.enum(["newest", "price-asc", "price-desc", "rating"]).default("newest"),
});

const createListingSchema = z.object({
  title: z.string().min(1).max(180),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  kind: z.enum(["PRODUCT", "SERVICE"]).default("PRODUCT"),
  priceMinor: z.string().transform((val) => BigInt(val)),
  currency: z.string().length(3).default("NGN"),
  stockOnHand: z.coerce.number().int().nonnegative().optional(),
  serviceDurationMins: z.coerce.number().int().positive().optional(),
  serviceArea: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  try {
    // Public read: a session is optional. Signed-in sellers/admins get a bit
    // more (see the status handling below); everyone else gets ACTIVE listings.
    const userId = await getOptionalUserId();

    const { searchParams } = new URL(req.url);
    const parsed = listingQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      category: searchParams.get("category"),
      kind: searchParams.get("kind"),
      status: searchParams.get("status"),
      sellerId: searchParams.get("sellerId"),
      q: searchParams.get("q"),
      sort: searchParams.get("sort") ?? undefined,
    });

    const { page, limit, category, kind, status, sellerId, q, sort } = parsed;

    const where: Record<string, unknown> = {};

    const roles = userId
      ? ((await prisma.user.findUnique({
          where: { id: userId },
          select: { roles: true },
        }))?.roles ?? [])
      : [];
    const isSeller = roles.includes("SELLER");
    const isAdmin = roles.includes("ADMIN");

    // The public feed always defaults to ACTIVE. A non-active status is only
    // honoured for an admin, or for a seller scoping to their own listings.
    if (status && (isAdmin || (isSeller && sellerId && sellerId === userId))) {
      where.status = status;
    } else {
      where.status = "ACTIVE";
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (category) {
      // Match the category itself plus its subcategories so a top-level filter
      // includes listings filed under children.
      const categoryRecord = await prisma.category.findUnique({
        where: { slug: category },
        select: { id: true, children: { select: { id: true } } },
      });
      where.categoryId = categoryRecord
        ? {
            in: [
              categoryRecord.id,
              ...categoryRecord.children.map((child) => child.id),
            ],
          }
        : { in: [] };
    }
    if (kind) {
      where.kind = kind;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: listingOrderBy(sort),
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    const ratings = await getListingRatings(listings.map((listing) => listing.id));

    return NextResponse.json(
      toJsonPayload({
        listings: withListingRatings(listings, ratings),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }),
    );
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
    console.error("Get listings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireVerifiedUser();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (!user || !user.roles.includes("SELLER")) {
      return NextResponse.json(
        { error: "Only registered sellers can create listings" },
        { status: 403 },
      );
    }

    // Sellers must finish onboarding before they can create listings.
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
          error: "Complete your seller profile before creating listings",
          code: "SELLER_PROFILE_INCOMPLETE",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const data = createListingSchema.parse(body);

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const slug = await uniqueSlug(data.title);

    const listing = await prisma.listing.create({
      data: {
        sellerId: userId,
        categoryId: data.categoryId,
        slug,
        title: data.title,
        description: data.description,
        kind: data.kind,
        priceMinor: data.priceMinor,
        currency: data.currency,
        stockOnHand: data.stockOnHand ?? null,
        serviceDurationMins: data.serviceDurationMins ?? null,
        serviceArea: data.serviceArea ?? null,
        images: data.images,
        ...(data.attributes !== undefined
          ? { attributes: data.attributes as unknown as InputJsonValue }
          : {}),
        status: "DRAFT",
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ listing }, { status: 201 });
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
