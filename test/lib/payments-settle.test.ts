// @ts-nocheck
const paymentFindUnique = jest.fn();
const paymentUpdate = jest.fn();
const orderUpdate = jest.fn();
const ledgerUpsert = jest.fn();

const tx = {
  payment: { findUnique: paymentFindUnique, update: paymentUpdate },
  order: { update: orderUpdate },
  ledgerEntry: { upsert: ledgerUpsert },
};

const prisma = {
  $transaction: jest.fn((callback) => callback(tx)),
};

jest.mock("@/lib/db/prisma", () => ({ prisma }));

const { settleSuccessfulPayment } = require("@/lib/payments/settle");

function basePayment(overrides = {}) {
  return {
    id: "pay_1",
    userId: "buyer_1",
    orderId: "order_1",
    status: "INITIATED",
    currency: "NGN",
    amountMinor: BigInt(100000),
    order: {
      id: "order_1",
      buyerId: "buyer_1",
      sellerId: "seller_1",
      status: "PENDING_PAYMENT",
      totalMinor: BigInt(100000),
      currency: "NGN",
      deliveryCode: null,
      deliveryCodeExpiresAt: null,
    },
    ...overrides,
  };
}

describe("settleSuccessfulPayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    paymentFindUnique.mockResolvedValue(basePayment());
    paymentUpdate.mockResolvedValue({});
    orderUpdate.mockResolvedValue({});
    ledgerUpsert.mockResolvedValue({});
  });

  it("marks the payment paid, moves the order, mints a code and records escrow", async () => {
    const result = await settleSuccessfulPayment({
      paymentId: "pay_1",
      providerAmountMinor: BigInt(100000),
      providerCurrency: "NGN",
      reference: "ref_1",
    });

    expect(result).toEqual({ status: "settled" });
    expect(paymentUpdate).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      data: expect.objectContaining({
        status: "SUCCEEDED",
        amountMinor: BigInt(100000),
        currency: "NGN",
      }),
    });
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: expect.objectContaining({
        status: "PAID",
        deliveryCode: expect.stringMatching(/^\d{6}$/),
        deliveryCodeAttempts: 0,
      }),
    });
    expect(ledgerUpsert).toHaveBeenCalledTimes(2);
    expect(ledgerUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idempotencyKey: "paystack:escrow:ref_1" },
      }),
    );
  });

  it("fails the payment when the provider amount is short", async () => {
    const result = await settleSuccessfulPayment({
      paymentId: "pay_1",
      providerAmountMinor: BigInt(1),
      providerCurrency: "NGN",
      reference: "ref_1",
    });

    expect(result).toEqual({
      status: "amount_mismatch",
      expected: BigInt(100000),
      received: BigInt(1),
    });
    expect(paymentUpdate).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      data: { status: "FAILED" },
    });
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(ledgerUpsert).not.toHaveBeenCalled();
  });

  it("rejects a currency mismatch", async () => {
    const result = await settleSuccessfulPayment({
      paymentId: "pay_1",
      providerAmountMinor: BigInt(100000),
      providerCurrency: "USD",
      reference: "ref_1",
    });

    expect(result.status).toBe("currency_mismatch");
    expect(paymentUpdate).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      data: { status: "FAILED" },
    });
    expect(ledgerUpsert).not.toHaveBeenCalled();
  });

  it("is idempotent once a payment has succeeded", async () => {
    paymentFindUnique.mockResolvedValue(
      basePayment({
        status: "SUCCEEDED",
        order: {
          ...basePayment().order,
          status: "PAID",
          deliveryCode: "123456",
        },
      }),
    );

    const result = await settleSuccessfulPayment({
      paymentId: "pay_1",
      providerAmountMinor: BigInt(100000),
      providerCurrency: "NGN",
      reference: "ref_1",
    });

    expect(result).toEqual({ status: "already_settled" });
    expect(paymentUpdate).not.toHaveBeenCalled();
    expect(ledgerUpsert).not.toHaveBeenCalled();
  });

  it("records a late charge without reopening a closed order", async () => {
    paymentFindUnique.mockResolvedValue(
      basePayment({
        order: {
          ...basePayment().order,
          status: "CANCELLED",
        },
      }),
    );

    const result = await settleSuccessfulPayment({
      paymentId: "pay_1",
      providerAmountMinor: BigInt(100000),
      providerCurrency: "NGN",
      reference: "ref_1",
    });

    expect(result).toEqual({
      status: "order_not_pending",
      orderStatus: "CANCELLED",
    });
    expect(paymentUpdate).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      data: expect.objectContaining({ status: "SUCCEEDED" }),
    });
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(ledgerUpsert).not.toHaveBeenCalled();
  });
});
