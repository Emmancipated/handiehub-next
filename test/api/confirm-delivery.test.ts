// @ts-nocheck
const orderFindUnique = jest.fn();
const orderUpdate = jest.fn();
const userFindUnique = jest.fn();
const txOrderUpdate = jest.fn();
const releaseEscrowForOrder = jest.fn();

const tx = {
  order: { update: txOrderUpdate },
};

const prisma = {
  order: { findUnique: orderFindUnique, update: orderUpdate },
  user: { findUnique: userFindUnique },
  $transaction: jest.fn((callback) => callback(tx)),
};

jest.mock("@/lib/db/prisma", () => ({ prisma }));
jest.mock("@/lib/wallet/escrow", () => ({
  releaseEscrowForOrder: (...args: any[]) => releaseEscrowForOrder(...args),
}));
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

const { POST: confirmDelivery } = require("@/api/orders/[id]/confirm-delivery/route");

const future = new Date(Date.now() + 60 * 60 * 1000);

function order(overrides = {}) {
  return {
    id: "order_1",
    buyerId: "buyer_1",
    sellerId: "seller_1",
    status: "SHIPPED",
    deliveryCode: "123456",
    deliveryCodeExpiresAt: future,
    deliveryCodeAttempts: 0,
    totalMinor: BigInt(100000),
    currency: "NGN",
    ...overrides,
  };
}

function post(body: unknown) {
  return confirmDelivery(
    new Request("http://localhost/api/orders/order_1/confirm-delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "order_1" }) },
  );
}

describe("POST /api/orders/[id]/confirm-delivery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    mockRequireVerifiedUser.mockResolvedValue("seller_1");
    orderFindUnique.mockResolvedValue(order());
    userFindUnique.mockResolvedValue({ roles: ["SELLER"] });
    orderUpdate.mockResolvedValue({});
    txOrderUpdate.mockResolvedValue({
      ...order(),
      status: "COMPLETED",
      deliveryCode: null,
      deliveryCodeExpiresAt: null,
    });
    releaseEscrowForOrder.mockResolvedValue(true);
  });

  it("only lets the seller confirm delivery", async () => {
    mockRequireVerifiedUser.mockResolvedValue("buyer_1");
    userFindUnique.mockResolvedValue({ roles: ["CUSTOMER"] });

    await post({ code: "123456" });

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Only the seller can confirm delivery" },
      { status: 403 },
    );
    expect(txOrderUpdate).not.toHaveBeenCalled();
  });

  it("increments attempts on a wrong code", async () => {
    await post({ code: "000000" });

    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: { deliveryCodeAttempts: { increment: 1 } },
    });
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Incorrect delivery code", code: "DELIVERY_CODE_INVALID" },
      { status: 400 },
    );
    expect(txOrderUpdate).not.toHaveBeenCalled();
  });

  it("rejects an expired code", async () => {
    orderFindUnique.mockResolvedValue(
      order({ deliveryCodeExpiresAt: new Date(Date.now() - 1000) }),
    );

    await post({ code: "123456" });

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "DELIVERY_CODE_EXPIRED" }),
      { status: 400 },
    );
  });

  it("locks after five failed attempts", async () => {
    orderFindUnique.mockResolvedValue(order({ deliveryCodeAttempts: 5 }));

    await post({ code: "123456" });

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "DELIVERY_CODE_LOCKED" }),
      { status: 429 },
    );
  });

  it("completes the order and releases escrow with the right code", async () => {
    await post({ code: "123456" });

    expect(txOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order_1" },
        data: expect.objectContaining({
          status: "COMPLETED",
          deliveryCode: null,
        }),
      }),
    );
    expect(releaseEscrowForOrder).toHaveBeenCalledTimes(1);
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Delivery confirmed",
        order: expect.objectContaining({ status: "COMPLETED" }),
      }),
      undefined,
    );
  });
});
