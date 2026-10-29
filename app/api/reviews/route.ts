import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const createReviewSchema = z.object({
  orderId: z.string().min(1),
  listingId: z.string().min(1),
  sellerId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
});

const reviewsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  listingId: z.string().optional(),
  sellerId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const authorId = await requireVerifiedUser();

    const body = await req.json();
    const data = createReviewSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.buyerId !== authorId) {
      return NextResponse.json(
        { error: "Only the buyer can review this order" },
        { status: 403 },
      );
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Can only review delivered orders" },
        { status: 400 },
      );
    }

    const existing = await prisma.review.findUnique({
      where: { orderId: data.orderId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Review already exists for this order" },
        { status: 409 },
      );
    }

    const review = await prisma.review.create({
      data: {
        orderId: data.orderId,
        listingId: data.listingId,
        authorId,
        sellerId: data.sellerId,
        rating: data.rating,
        comment: data.comment ?? null,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
        listing: { select: { id: true, title: true, slug: true } },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = reviewsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      listingId: searchParams.get("listingId") ?? undefined,
      sellerId: searchParams.get("sellerId") ?? undefined,
    });

    const { page, limit, listingId, sellerId } = parsed;

    const where: Record<string, unknown> = {};
    if (listingId) where.listingId = listingId;
    if (sellerId) where.sellerId = sellerId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
          listing: { select: { id: true, title: true, slug: true } },
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
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
