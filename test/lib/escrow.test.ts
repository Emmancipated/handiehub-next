// @ts-nocheck
const findFirst = jest.fn();
const findUnique = jest.fn();
const create = jest.fn();

const tx = {
  ledgerEntry: { findFirst, findUnique, create },
};

const { releaseEscrowForOrder } = require("@/lib/wallet/escrow");

const order = {
  id: "order_1",
  sellerId: "seller_1",
  totalMinor: BigInt(100000),
  currency: "NGN",
};

describe("releaseEscrowForOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findFirst.mockResolvedValue({
      amountMinor: BigInt(100000),
      currency: "NGN",
      paymentId: "pay_1",
    });
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({});
  });

  it("releases the hold to the seller and deducts the platform fee once", async () => {
    const released = await releaseEscrowForOrder(tx, order);

    expect(released).toBe(true);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey: "escrow-release:order_1",
        kind: "ESCROW_RELEASE",
        direction: "CREDIT",
        amountMinor: BigInt(100000),
        userId: "seller_1",
      }),
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey: "platform-fee:order_1",
        kind: "PLATFORM_FEE",
        direction: "DEBIT",
        amountMinor: BigInt(5000),
        userId: "seller_1",
      }),
    });
  });

  it("does nothing when there is no escrow hold", async () => {
    findFirst.mockResolvedValue(null);

    const released = await releaseEscrowForOrder(tx, order);

    expect(released).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("does not release twice", async () => {
    findUnique.mockResolvedValue({ id: "entry_1" });

    const released = await releaseEscrowForOrder(tx, order);

    expect(released).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
