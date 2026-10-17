import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const orderItemSchema = z.object({
  listingId: z.string().optional().nullable(),
  titleSnapshot: z.string().min(1).max(180),
  unitPriceMinor: z.string().transform((val) => BigInt(val)),
  quantity: z.coerce.number().int().positive().default(1),
});

const createOrderSchema = z.object({
  sellerId: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  currency: z.string().length(3).default("NGN"),
  deliveryAddress: z.record(z.string(), z.unknown()).optional().nullable(),
  serviceSchedule: z.coerce.date().optional().nullable(),
});

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HH-${ts}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const buyerId = await requireUserId();

    const body = await req.json();
    const data = createOrderSchema.parse(body);

    const seller = await prisma.user.findUnique({
      where: { id: data.sellerId },
      select: { id: true, roles: true },
    });
    if (!seller || !seller.roles.includes("SELLER")) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    if (seller.id === buyerId) {
      return NextResponse.json({ error: "Cannot buy from yourself" }, { status: 400 });
    }

    let totalMinor = BigInt(0);
    const itemsWithListing: Array<{
      listingId: string | null | undefined;
      titleSnapshot: string;
      unitPriceMinor: bigint;
      quantity: number;
    }> = [];

    for (const item of data.items) {
      let listing = null;
      if (item.listingId) {
        listing = await prisma.listing.findUnique({
          where: { id: item.listingId },
          select: { id: true, title: true, status: true, sellerId: true },
        });
        if (!listing || listing.status !== "ACTIVE") {
          return NextResponse.json(
            { error: `Listing ${item.listingId} not available` },
            { status: 400 },
          );
        }
        if (listing.sellerId !== data.sellerId) {
          return NextResponse.json(
            { error: `Listing ${item.listingId} does not belong to seller` },
            { status: 400 },
          );
        }
      }

      totalMinor += item.unitPriceMinor * BigInt(item.quantity);
      itemsWithListing.push({
        listingId: item.listingId,
        titleSnapshot: item.titleSnapshot,
        unitPriceMinor: item.unitPriceMinor,
        quantity: item.quantity,
      });
    }

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId,
        sellerId: data.sellerId,
        status: "PENDING_PAYMENT",
        totalMinor,
        currency: data.currency,
        ...(data.deliveryAddress !== undefined
          ? {
              deliveryAddress: data.deliveryAddress as unknown as Parameters<
                typeof prisma.order.create
              >[0]["data"]["deliveryAddress"],
            }
          : {}),
        serviceSchedule: data.serviceSchedule ?? null,
        items: {
          create: itemsWithListing.map((item) => ({
            listingId: item.listingId ?? undefined,
            titleSnapshot: item.titleSnapshot,
            unitPriceMinor: item.unitPriceMinor,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
        buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
        seller: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json({ order }, { status: 201 });
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

const orderQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum([
    "PENDING_PAYMENT",
    "PAID",
    "ACCEPTED",
    "IN_PROGRESS",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "DISPUTED",
    "REFUNDED",
  ]).nullable(),
  buyerId: z.string().nullable(),
  sellerId: z.string().nullable(),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const { searchParams } = new URL(req.url);
    const parsed = orderQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
      buyerId: searchParams.get("buyerId"),
      sellerId: searchParams.get("sellerId"),
    });

    const { page, limit, status, buyerId, sellerId } = parsed;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = user.roles.includes("ADMIN");

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (buyerId) where.buyerId = buyerId;
    if (sellerId) where.sellerId = sellerId;

    // Non-admins can only see their own orders (as buyer or seller)
    if (!isAdmin) {
      where.OR = [{ buyerId: userId }, { sellerId: userId }];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: true,
          buyer: { select: { id: true, firstName: true, lastName: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
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
