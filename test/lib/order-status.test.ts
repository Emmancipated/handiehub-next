import {
  actorForOrder,
  canTransition,
  isTerminal,
} from "@/lib/orders/status";

describe("order status transitions", () => {
  it("allows the seller to accept a paid order and fulfil it", () => {
    expect(canTransition("seller", "PAID", "ACCEPTED")).toBe(true);
    expect(canTransition("seller", "ACCEPTED", "IN_PROGRESS")).toBe(true);
    expect(canTransition("seller", "IN_PROGRESS", "SHIPPED")).toBe(true);
  });

  it("does not let the seller mark an order delivered", () => {
    expect(canTransition("seller", "SHIPPED", "DELIVERED")).toBe(false);
    expect(canTransition("seller", "IN_PROGRESS", "DELIVERED")).toBe(false);
  });

  it("does not let the seller complete or refund their own order", () => {
    expect(canTransition("seller", "DELIVERED", "COMPLETED")).toBe(false);
    expect(canTransition("seller", "DELIVERED", "REFUNDED")).toBe(false);
  });

  it("lets the buyer cancel before payment and complete after delivery", () => {
    expect(canTransition("buyer", "PENDING_PAYMENT", "CANCELLED")).toBe(true);
    expect(canTransition("buyer", "PAID", "CANCELLED")).toBe(false);
    expect(canTransition("buyer", "SHIPPED", "COMPLETED")).toBe(true);
    expect(canTransition("buyer", "DELIVERED", "COMPLETED")).toBe(true);
    expect(canTransition("buyer", "PAID", "ACCEPTED")).toBe(false);
  });

  it("lets the admin resolve a dispute", () => {
    expect(canTransition("admin", "DISPUTED", "REFUNDED")).toBe(true);
    expect(canTransition("admin", "PAID", "REFUNDED")).toBe(true);
  });

  it("treats terminal states as final", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("REFUNDED")).toBe(true);
    expect(isTerminal("DELIVERED")).toBe(false);
  });

  it("identifies the actor from roles and order ownership", () => {
    const order = { buyerId: "buyer", sellerId: "seller" };
    expect(actorForOrder("admin", ["ADMIN"], order)).toBe("admin");
    expect(actorForOrder("seller", ["SELLER"], order)).toBe("seller");
    expect(actorForOrder("buyer", ["CUSTOMER"], order)).toBe("buyer");
    expect(actorForOrder("stranger", ["CUSTOMER"], order)).toBeNull();
  });
});
