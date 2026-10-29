// @ts-nocheck
const orderFindMany = jest.fn();
const userFindUnique = jest.fn();
const txOrderUpdateMany = jest.fn();
const txListingUpdateMany = jest.fn();

const tx = {
  order: { updateMany: txOrderUpdateMany },
  listing: { updateMany: txListingUpdateMany },
};

const prisma = {
  order: { findMany: orderFindMany },
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
  }
  return {
    requireVerifiedUser: (...args: any[]) => mockRequireVerifiedUser(...args),
    AuthError,
  };
});

const { POST: runCleanup } = require("@/api/orders/cleanup/route");

describe("POST /api/orders/cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    delete process.env.CRON_SECRET;
    mockRequireVerifiedUser.mockResolvedValue("admin_1");
    userFindUnique.mockResolvedValue({ roles: ["ADMIN"] });
    txOrderUpdateMany.mockResolvedValue({ count: 1 });
    txListingUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("requires an admin or cron secret", async () => {
    userFindUnique.mockResolvedValue({ roles: ["CUSTOMER"] });

    await runCleanup(new Request("http://localhost/api/orders/cleanup"));

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Unauthorized" },
      { status: 401 },
    );
    expect(orderFindMany).not.toHaveBeenCalled();
  });

  it("cancels stale unpaid orders and restores their stock", async () => {
    orderFindMany.mockResolvedValue([
      {
        id: "order_1",
        items: [{ listingId: "listing_1", quantity: 2 }],
        payments: [{ status: "INITIATED" }],
      },
      {
        id: "order_2",
        items: [{ listingId: "listing_2", quantity: 1 }],
        payments: [{ status: "SUCCEEDED" }],
      },
    ]);

    await runCleanup(new Request("http://localhost/api/orders/cleanup"));

    expect(txOrderUpdateMany).toHaveBeenCalledTimes(1);
    expect(txOrderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order_1", status: "PENDING_PAYMENT" },
        data: expect.objectContaining({ status: "CANCELLED" }),
      }),
    );
    expect(txListingUpdateMany).toHaveBeenCalledWith({
      where: { id: "listing_1", stockOnHand: { not: null } },
      data: { stockOnHand: { increment: 2 } },
    });
    expect(nextResponseJson).toHaveBeenCalledWith(
      { scanned: 2, cancelled: 1 },
      undefined,
    );
  });

  it("accepts a bearer cron secret without a session", async () => {
    process.env.CRON_SECRET = "cron_test";
    orderFindMany.mockResolvedValue([]);

    await runCleanup(
      new Request("http://localhost/api/orders/cleanup", {
        headers: { Authorization: "Bearer cron_test" },
      }),
    );

    expect(mockRequireVerifiedUser).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      { scanned: 0, cancelled: 0 },
      undefined,
    );
  });
});
