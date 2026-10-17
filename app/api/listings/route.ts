import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { uniqueSlug } from "@/lib/listing/slug";

const listingQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().nullable(),
  kind: z.enum(["PRODUCT", "SERVICE"]).nullable(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "REJECTED", "ARCHIVED"]).nullable(),
  sellerId: z.string().nullable(),
  q: z.string().nullable(),
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
    const userId = await requireUserId();

    const { searchParams } = new URL(req.url);
    const parsed = listingQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      category: searchParams.get("category"),
      kind: searchParams.get("kind"),
      status: searchParams.get("status"),
      sellerId: searchParams.get("sellerId"),
      q: searchParams.get("q"),
    });

    const { page, limit, category, kind, status, sellerId, q } = parsed;

    const where: Record<string, unknown> = {};

    // Public viewers only see ACTIVE listings; sellers can see their own drafts too.
    const isSeller = (await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    }))?.roles.includes("SELLER");

    if (!isSeller) {
      where.status = "ACTIVE";
    } else if (status) {
      where.status = status;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    } else if (!isSeller) {
      where.sellerId = { not: undefined };
    }

    if (category) {
      where.categoryId = category;
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
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

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
