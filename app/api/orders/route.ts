import { NextResponse } from "next/server";
import { requireUserId, requireVerifiedUser } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const orderItemSchema = z.object({
  listingId: z.string().min(1),
  quantity: z.coerce.number().int().positive().max(50).default(1),
});

const createOrderSchema = z.object({
  sellerId: z.string().min(1).optional(),
  items: z.array(orderItemSchema).min(1).max(20),
  currency: z.string().length(3).optional(),
  deliveryAddress: z.record(z.string(), z.unknown()).optional().nullable(),
  serviceSchedule: z.coerce.date().optional().nullable(),
});

class OrderValidationError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "ORDER_INVALID") {
    super(message);
    this.name = "OrderValidationError";
    this.status = status;
    this.code = code;
  }
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HH-${ts}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const buyerId = await requireVerifiedUser();

    const body = await req.json();
    const data = createOrderSchema.parse(body);

    const listingIds = data.items.map((item) => item.listingId);
    if (new Set(listingIds).size !== listingIds.length) {
      return NextResponse.json(
        { error: "Each listing can only appear once per order" },
        { status: 400 },
      );
    }

    const listings = await prisma.listing.findMany({
      where: { id: { in: listingIds } },
      select: {
        id: true,
        title: true,
        status: true,
        sellerId: true,
        kind: true,
        priceMinor: true,
        currency: true,
        stockOnHand: true,
      },
    });

    if (listings.length !== listingIds.length) {
      return NextResponse.json(
        { error: "One or more listings are no longer available" },
        { status: 400 },
      );
    }

    const listingById = new Map(listings.map((listing) => [listing.id, listing]));
    const first = listingById.get(listingIds[0]);

    if (!first) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listings.some((listing) => listing.status !== "ACTIVE")) {
      return NextResponse.json(
        { error: "One or more listings are not available" },
        { status: 400 },
      );
    }

    if (listings.some((listing) => listing.sellerId !== first.sellerId)) {
      return NextResponse.json(
        { error: "All items in an order must come from the same seller" },
        { status: 400 },
      );
    }

    if (listings.some((listing) => listing.kind !== first.kind)) {
      return NextResponse.json(
        { error: "Products and services cannot be mixed in one order" },
        { status: 400 },
      );
    }

    if (listings.some((listing) => listing.currency !== first.currency)) {
      return NextResponse.json(
        { error: "All items in an order must use the same currency" },
        { status: 400 },
      );
    }

    if (data.sellerId && data.sellerId !== first.sellerId) {
      return NextResponse.json(
        { error: "Seller does not match the selected listings" },
        { status: 400 },
      );
    }

    if (first.sellerId === buyerId) {
      return NextResponse.json(
        { error: "Cannot buy from yourself" },
        { status: 400 },
      );
    }

    const seller = await prisma.user.findUnique({
      where: { id: first.sellerId },
      select: { id: true, roles: true },
    });
    if (!seller || !seller.roles.includes("SELLER")) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    if (first.kind === "SERVICE") {
      if (!data.serviceSchedule) {
        return NextResponse.json(
          { error: "Choose a date and time for this service" },
          { status: 400 },
        );
      }
      if (data.serviceSchedule.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "Choose a future date and time for this service" },
          { status: 400 },
        );
      }
    }

    const pricedItems = data.items.map((item) => {
      const listing = listingById.get(item.listingId)!;
      if (
        listing.kind === "PRODUCT" &&
        listing.stockOnHand !== null &&
        item.quantity > listing.stockOnHand
      ) {
        throw new OrderValidationError(
          `Only ${listing.stockOnHand} of ${listing.title} left in stock`,
          409,
          "STOCK_UNAVAILABLE",
        );
      }
      return {
        listingId: listing.id,
        titleSnapshot: listing.title,
        unitPriceMinor: listing.priceMinor,
        quantity: item.quantity,
        stockOnHand: listing.stockOnHand,
        kind: listing.kind,
      };
    });

    // Prices, titles and the seller are derived from the database, never from
    // the request body, so a tampered client cannot underpay an order.
    const totalMinor = pricedItems.reduce(
      (sum, item) => sum + item.unitPriceMinor * BigInt(item.quantity),
      BigInt(0),
    );
    const currency = first.currency;
    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      for (const item of pricedItems) {
        if (item.kind !== "PRODUCT" || item.stockOnHand === null) continue;

        // Conditional decrement closes the race between the check above and
        // another buyer purchasing the last unit.
        const decremented = await tx.listing.updateMany({
          where: {
            id: item.listingId,
            stockOnHand: { gte: item.quantity },
          },
          data: { stockOnHand: { decrement: item.quantity } },
        });

        if (decremented.count !== 1) {
          throw new OrderValidationError(
            `${item.titleSnapshot} just went out of stock`,
            409,
            "STOCK_UNAVAILABLE",
          );
        }
      }

      return tx.order.create({
        data: {
          orderNumber,
          buyerId,
          sellerId: first.sellerId,
          status: "PENDING_PAYMENT",
          totalMinor,
          currency,
          ...(data.deliveryAddress !== undefined
            ? {
                deliveryAddress: data.deliveryAddress as unknown as Parameters<
                  typeof prisma.order.create
                >[0]["data"]["deliveryAddress"],
              }
            : {}),
          serviceSchedule:
            first.kind === "SERVICE" ? data.serviceSchedule ?? null : null,
          items: {
            create: pricedItems.map((item) => ({
              listingId: item.listingId,
              titleSnapshot: item.titleSnapshot,
              unitPriceMinor: item.unitPriceMinor,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: true,
          buyer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          seller: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof OrderValidationError) {
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
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
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
          review: { select: { id: true } },
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
