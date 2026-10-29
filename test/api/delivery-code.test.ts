// @ts-nocheck
const orderFindUnique = jest.fn();
const orderUpdate = jest.fn();

const prisma = {
  order: { findUnique: orderFindUnique, update: orderUpdate },
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

const { GET: getDeliveryCode } = require("@/api/orders/[id]/delivery-code/route");

const future = new Date(Date.now() + 60 * 60 * 1000);

function order(overrides = {}) {
  return {
    id: "order_1",
    buyerId: "buyer_1",
    status: "PAID",
    deliveryCode: "123456",
    deliveryCodeExpiresAt: future,
    deliveryCodeAttempts: 0,
    ...overrides,
  };
}

function get(url = "http://localhost/api/orders/order_1/delivery-code") {
  return getDeliveryCode(new Request(url), {
    params: Promise.resolve({ id: "order_1" }),
  });
}

describe("GET /api/orders/[id]/delivery-code", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    mockRequireVerifiedUser.mockResolvedValue("buyer_1");
    orderFindUnique.mockResolvedValue(order());
    orderUpdate.mockResolvedValue({});
  });

  it("returns the buyer's existing code", async () => {
    await get();

    expect(orderUpdate).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      { code: "123456", expiresAt: future },
      undefined,
    );
  });

  it("mints a code for a paid order that has none", async () => {
    orderFindUnique.mockResolvedValue(
      order({ deliveryCode: null, deliveryCodeExpiresAt: null }),
    );

    await get();

    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: expect.objectContaining({
        deliveryCode: expect.stringMatching(/^\d{6}$/),
        deliveryCodeAttempts: 0,
      }),
    });
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: expect.stringMatching(/^\d{6}$/) }),
      undefined,
    );
  });

  it("rotates the code when asked", async () => {
    await get(
      "http://localhost/api/orders/order_1/delivery-code?refresh=1",
    );

    expect(orderUpdate).toHaveBeenCalled();
  });

  it("rotates after the attempt limit is reached", async () => {
    orderFindUnique.mockResolvedValue(order({ deliveryCodeAttempts: 5 }));

    await get();

    expect(orderUpdate).toHaveBeenCalled();
  });

  it("does not expose the code to the seller", async () => {
    mockRequireVerifiedUser.mockResolvedValue("seller_1");

    await get();

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Unauthorized" },
      { status: 403 },
    );
    expect(orderUpdate).not.toHaveBeenCalled();
  });

  it("does not mint a code before payment", async () => {
    orderFindUnique.mockResolvedValue(
      order({
        status: "PENDING_PAYMENT",
        deliveryCode: null,
        deliveryCodeExpiresAt: null,
      }),
    );

    await get();

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "ORDER_NOT_PAID" }),
      { status: 409 },
    );
    expect(orderUpdate).not.toHaveBeenCalled();
  });
});
