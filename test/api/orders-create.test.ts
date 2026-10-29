// @ts-nocheck
const listingFindMany = jest.fn();
const userFindUnique = jest.fn();
const orderCreate = jest.fn();
const listingUpdateMany = jest.fn();

const tx = {
  listing: { updateMany: listingUpdateMany },
  order: { create: orderCreate },
};

const prisma = {
  listing: { findMany: listingFindMany },
  user: { findUnique: userFindUnique },
  $transaction: jest.fn((callback) => callback(tx)),
};

jest.mock("@/lib/db/prisma", () => ({ prisma }));
jest.mock("server-only", () => {});

const nextResponseJson = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => {
      nextResponseJson(body, init);
      return { body, status: init?.status ?? 200, headers: new Map() };
    },
  },
}));

const mockRequireVerifiedUser = jest.fn();

jest.mock("@/lib/auth/current-user", () => {
  class AuthError extends Error {
    status = 401;
    code = "UNAUTHORIZED";
    constructor() {
      super("Unauthorized");
      this.name = "AuthError";
    }
  }
  return {
    requireUserId: mockRequireVerifiedUser,
    requireVerifiedUser: (...args: any[]) => mockRequireVerifiedUser(...args),
    AuthError,
  };
});

const { POST: createOrder } = require("@/api/orders/route");

const product = {
  id: "listing_1",
  title: "Electric kettle",
  status: "ACTIVE",
  sellerId: "seller_1",
  kind: "PRODUCT",
  priceMinor: BigInt(250000),
  currency: "NGN",
  stockOnHand: 5,
};

function post(body: unknown) {
  return createOrder(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    mockRequireVerifiedUser.mockResolvedValue("buyer_1");
    listingFindMany.mockResolvedValue([product]);
    userFindUnique.mockResolvedValue({ id: "seller_1", roles: ["SELLER"] });
    listingUpdateMany.mockResolvedValue({ count: 1 });
    orderCreate.mockImplementation(async ({ data }) => ({
      id: "order_1",
      ...data,
    }));
  });

  it("prices the order from the database and ignores client price fields", async () => {
    await post({
      sellerId: "seller_1",
      items: [
        {
          listingId: "listing_1",
          quantity: 2,
          unitPriceMinor: "1",
          titleSnapshot: "Fake title",
        },
      ],
      currency: "USD",
    });

    expect(orderCreate).toHaveBeenCalledTimes(1);
    const data = orderCreate.mock.calls[0][0].data;
    expect(data.totalMinor).toBe(BigInt(500000));
    expect(data.currency).toBe("NGN");
    expect(data.sellerId).toBe("seller_1");
    expect(data.items.create[0]).toEqual({
      listingId: "listing_1",
      titleSnapshot: "Electric kettle",
      unitPriceMinor: BigInt(250000),
      quantity: 2,
    });
    expect(listingUpdateMany).toHaveBeenCalledWith({
      where: { id: "listing_1", stockOnHand: { gte: 2 } },
      data: { stockOnHand: { decrement: 2 } },
    });
  });

  it("rejects buying from yourself", async () => {
    mockRequireVerifiedUser.mockResolvedValue("seller_1");

    await post({ items: [{ listingId: "listing_1", quantity: 1 }] });

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Cannot buy from yourself" },
      { status: 400 },
    );
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("rejects quantities above available stock", async () => {
    await post({ items: [{ listingId: "listing_1", quantity: 6 }] });

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "STOCK_UNAVAILABLE" }),
      { status: 409 },
    );
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("rejects a cart mixing sellers", async () => {
    listingFindMany.mockResolvedValue([
      product,
      { ...product, id: "listing_2", sellerId: "seller_2" },
    ]);

    await post({
      items: [
        { listingId: "listing_1", quantity: 1 },
        { listingId: "listing_2", quantity: 1 },
      ],
    });

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "All items in an order must come from the same seller" },
      { status: 400 },
    );
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("requires a future schedule for services", async () => {
    listingFindMany.mockResolvedValue([
      { ...product, kind: "SERVICE", stockOnHand: null },
    ]);

    await post({ items: [{ listingId: "listing_1", quantity: 1 }] });
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Choose a date and time for this service" },
      { status: 400 },
    );

    nextResponseJson.mockClear();
    await post({
      items: [{ listingId: "listing_1", quantity: 1 }],
      serviceSchedule: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Choose a future date and time for this service" },
      { status: 400 },
    );
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("fails the transaction if stock is taken by another buyer", async () => {
    listingUpdateMany.mockResolvedValue({ count: 0 });

    await post({ items: [{ listingId: "listing_1", quantity: 1 }] });

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "STOCK_UNAVAILABLE" }),
      { status: 409 },
    );
    expect(orderCreate).not.toHaveBeenCalled();
  });
});
