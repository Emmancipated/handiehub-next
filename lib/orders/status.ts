export const ORDER_STATUSES = [
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
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderActor = "buyer" | "seller" | "admin";

/**
 * Seller-driven fulfilment path. Sellers cannot mark an order delivered: the
 * buyer's delivery code (or the buyer's own confirmation) completes it.
 */
const SELLER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [],
  PAID: ["ACCEPTED"],
  ACCEPTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["SHIPPED"],
  SHIPPED: [],
  DELIVERED: [],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: [],
  REFUNDED: [],
};

/**
 * Buyer-driven transitions. A buyer can abandon an unpaid order, confirm
 * receipt, complete a delivered order, or escalate a problem.
 */
const BUYER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: [],
  ACCEPTED: [],
  IN_PROGRESS: [],
  SHIPPED: ["DELIVERED", "COMPLETED", "DISPUTED"],
  DELIVERED: ["COMPLETED", "DISPUTED"],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: [],
  REFUNDED: [],
};

const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["ACCEPTED", "CANCELLED", "REFUNDED", "DISPUTED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED", "REFUNDED", "DISPUTED"],
  IN_PROGRESS: ["SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "DISPUTED"],
  SHIPPED: ["DELIVERED", "REFUNDED", "DISPUTED"],
  DELIVERED: ["COMPLETED", "REFUNDED", "DISPUTED"],
  COMPLETED: ["REFUNDED", "DISPUTED"],
  CANCELLED: [],
  DISPUTED: ["REFUNDED", "CANCELLED", "COMPLETED"],
  REFUNDED: [],
};

export function canTransition(
  actor: OrderActor,
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return false;
  const table =
    actor === "admin"
      ? ADMIN_TRANSITIONS
      : actor === "seller"
        ? SELLER_TRANSITIONS
        : BUYER_TRANSITIONS;
  return table[from]?.includes(to) ?? false;
}

export function actorForOrder(
  userId: string,
  roles: string[],
  order: { buyerId: string; sellerId: string },
): OrderActor | null {
  if (roles.includes("ADMIN")) return "admin";
  if (order.sellerId === userId) return "seller";
  if (order.buyerId === userId) return "buyer";
  return null;
}

/** Statuses after which no further updates (schedule or status) are allowed. */
export const TERMINAL_STATUSES: OrderStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
