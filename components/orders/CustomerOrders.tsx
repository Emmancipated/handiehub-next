"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  KeyRound,
  Loader2,
  MessageSquare,
  Package,
  Star,
  Store,
  X,
} from "lucide-react";

type OrderKind = "PRODUCT" | "SERVICE";

type ApiOrderItem = {
  listingId: string | null;
  titleSnapshot: string;
  quantity: number;
  unitPriceMinor: bigint | number;
  listing?: { kind: OrderKind | null; slug: string | null } | null;
};

type ApiOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalMinor: bigint | number;
  currency: string;
  items: ApiOrderItem[];
  serviceSchedule: string | null;
  createdAt: string;
  sellerId: string;
  review: { id: string } | null;
  seller: { firstName: string | null; lastName: string | null } | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalMinor: number;
  currency: string;
  items: {
    listingId: string | null;
    titleSnapshot: string;
    quantity: number;
    unitPriceMinor: number;
    kind: OrderKind | null;
  }[];
  serviceSchedule: string | null;
  createdAt: string;
  sellerId: string;
  review: { id: string } | null;
  seller: { firstName: string | null; lastName: string | null } | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING_PAYMENT: {
    label: "Pending Payment",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  PAID: {
    label: "Paid",
    color: "text-[#5B48FC]",
    bg: "bg-[#EFEDFF]",
    border: "border-[#5B48FC]/20",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  SHIPPED: {
    label: "Shipped",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  DELIVERED: {
    label: "Delivered",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  DISPUTED: {
    label: "Disputed",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  REFUNDED: {
    label: "Refunded",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const COPY = {
  PRODUCT: {
    title: "Orders",
    subtitle: "Track your purchases and deliveries.",
    empty: "You have not ordered any products yet.",
    emptyCta: "Shop products",
    emptyHref: "/products",
    icon: Package,
  },
  SERVICE: {
    title: "Bookings",
    subtitle: "Your service appointments and scheduled jobs.",
    empty: "You have not booked a professional yet.",
    emptyCta: "Hire a professional",
    emptyHref: "/handieman",
    icon: Calendar,
  },
} satisfies Record<
  OrderKind,
  {
    title: string;
    subtitle: string;
    empty: string;
    emptyCta: string;
    emptyHref: string;
    icon: React.ElementType;
  }
>;

export default function CustomerOrders({ kind }: { kind: OrderKind }) {
  const copy = COPY[kind];
  const EmptyIcon = copy.icon;
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewing, setReviewing] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [deliveryCodes, setDeliveryCodes] = useState<
    Record<string, { code: string; expiresAt: string }>
  >({});
  const [codeBusy, setCodeBusy] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/orders/my-orders?limit=100&kind=${kind}`, {
        credentials: "same-origin",
        signal,
      });
      if (!res.ok) throw new Error("Could not load your orders.");
      const data = await res.json();
      const mapped: Order[] = (data.orders ?? []).map((order: ApiOrder) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalMinor: Number(order.totalMinor) / 100,
        currency: order.currency,
        items: (order.items ?? []).map((item) => ({
          listingId: item.listingId ?? null,
          titleSnapshot: item.titleSnapshot,
          quantity: item.quantity,
          unitPriceMinor: Number(item.unitPriceMinor) / 100,
          kind: item.listing?.kind ?? null,
        })),
        serviceSchedule: order.serviceSchedule ?? null,
        createdAt: order.createdAt,
        sellerId: order.sellerId,
        review: order.review,
        seller: order.seller
          ? {
              firstName: order.seller.firstName,
              lastName: order.seller.lastName,
            }
          : null,
      }));
      setOrders(mapped);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const sellerName = (order: Order) =>
    order.seller
      ? [order.seller.firstName, order.seller.lastName].filter(Boolean).join(" ") ||
        "Seller"
      : "Seller";

  const openReview = (order: Order) => {
    setReviewing(order);
    setRating(5);
    setComment("");
    setReviewError(null);
  };

  const submitReview = async () => {
    if (!reviewing) return;
    const listingId = reviewing.items.find((item) => item.listingId)?.listingId;
    if (!listingId) {
      setReviewError("This order has no listing to review.");
      return;
    }

    setSubmitting(true);
    setReviewError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          orderId: reviewing.id,
          listingId,
          sellerId: reviewing.sellerId,
          rating,
          comment: comment.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not submit your review.");

      setOrders((current) =>
        current.map((order) =>
          order.id === reviewing.id
            ? { ...order, review: { id: data.review.id } }
            : order,
        ),
      );
      setReviewing(null);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Could not submit your review.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loadDeliveryCode = async (orderId: string, refresh = false) => {
    setCodeBusy(orderId);
    setError(null);
    try {
      const res = await fetch(
        `/api/orders/${orderId}/delivery-code${refresh ? "?refresh=1" : ""}`,
        {
          credentials: "same-origin",
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not load your delivery code.");
      }
      setDeliveryCodes((current) => ({
        ...current,
        [orderId]: { code: data.code, expiresAt: data.expiresAt },
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load your delivery code.",
      );
    } finally {
      setCodeBusy(null);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {    setBusy(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not update the order.");
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status: data.order?.status ?? order.status }
            : order,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update the order.",
      );
    } finally {
      setBusy(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "active")
      return !["DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"].includes(
        order.status,
      );
    if (activeTab === "completed")
      return ["DELIVERED", "COMPLETED"].includes(order.status);
    if (activeTab === "cancelled")
      return ["CANCELLED", "REFUNDED"].includes(order.status);
    return true;
  });

  return (
    <div className="font-sans text-[#0F172A]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            {copy.subtitle}
          </p>
        </div>
        <Link
          href={copy.emptyHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5B48FC] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#4A38E0]"
        >
          <EmptyIcon className="h-4 w-4" />
          {copy.emptyCta}
        </Link>
      </div>

      <div className="mb-6 flex w-full items-center gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5">
        {[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-[#EFEDFF] text-[#5B48FC]"
                : "text-gray-500 hover:text-[#0F172A]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-9 w-9 animate-spin text-[#5B48FC]" />
            <p className="text-sm font-medium text-gray-500">
              Loading your {kind === "SERVICE" ? "bookings" : "orders"}…
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <EmptyIcon className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="mb-1 text-lg font-bold">Nothing here yet</h3>
            <p className="mb-5 text-sm font-medium text-gray-500">{copy.empty}</p>
            <Link
              href={copy.emptyHref}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {copy.emptyCta}
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const status = STATUS_CONFIG[order.status] ?? {
              label: order.status,
              color: "text-gray-700",
              bg: "bg-gray-100",
              border: "border-gray-200",
            };
            const Icon = copy.icon;

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <header className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/40 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-extrabold">
                        {kind === "SERVICE" ? "Booking" : "Order"} #
                        {order.orderNumber}
                      </h3>
                      <span
                        className={`rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.color} ${status.bg} ${status.border}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(order.createdAt).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Store className="h-4 w-4 text-gray-400" />
                        {sellerName(order)}
                      </span>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                      Total
                    </p>
                    <p className="text-xl font-extrabold">
                      {formatMoney(order.totalMinor)}
                    </p>
                  </div>
                </header>

                <div className="p-5 md:p-6">
                  {order.serviceSchedule && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#5B48FC]/15 bg-[#EFEDFF]/50 px-4 py-3 text-sm font-semibold text-[#5B48FC]">
                      <Calendar className="h-4 w-4" />
                      Scheduled for{" "}
                      {new Date(order.serviceSchedule).toLocaleString("en-NG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.id}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="truncate text-sm font-bold">
                            {item.titleSnapshot}
                          </span>
                        </div>
                        <span className="whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500">
                          Qty:{" "}
                          <span className="font-bold text-[#0F172A]">
                            {item.quantity}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {!["COMPLETED", "CANCELLED", "REFUNDED", "DISPUTED"].includes(
                  order.status,
                ) && (
                  <footer className="px-5 pb-5 md:px-6 md:pb-6">
                    {["PAID", "ACCEPTED", "IN_PROGRESS", "SHIPPED", "DELIVERED"].includes(
                      order.status,
                    ) && (
                      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm">
                            <KeyRound className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-amber-900">
                              Delivery code
                            </p>
                            <p className="text-xs font-medium text-amber-800">
                              Share this with the seller when you receive your
                              order.
                            </p>
                          </div>
                        </div>
                        {deliveryCodes[order.id] ? (
                          <div className="sm:text-right">
                            <p className="text-xl font-extrabold tracking-[0.3em] text-amber-950">
                              {deliveryCodes[order.id].code}
                            </p>
                            <p className="text-[11px] font-medium text-amber-800">
                              Expires{" "}
                              {new Date(
                                deliveryCodes[order.id].expiresAt,
                              ).toLocaleDateString("en-NG", {
                                dateStyle: "medium",
                              })}
                            </p>
                            <button
                              onClick={() =>
                                void loadDeliveryCode(order.id, true)
                              }
                              disabled={codeBusy === order.id}
                              className="mt-1 text-[11px] font-bold text-amber-900 underline underline-offset-2 hover:text-amber-950 disabled:opacity-60"
                            >
                              New code
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => void loadDeliveryCode(order.id)}
                            disabled={codeBusy === order.id}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 disabled:opacity-60"
                          >
                            {codeBusy === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <KeyRound className="h-4 w-4" />
                            )}
                            Show code
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap justify-end gap-2">
                      {order.status === "PENDING_PAYMENT" && (
                        <button
                          onClick={() => void updateStatus(order.id, "CANCELLED")}
                          disabled={busy === order.id}
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Cancel order
                        </button>
                      )}
                      {["SHIPPED", "DELIVERED"].includes(order.status) && (
                        <button
                          onClick={() => void updateStatus(order.id, "COMPLETED")}
                          disabled={busy === order.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {busy === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                          Confirm receipt
                        </button>
                      )}
                    </div>
                  </footer>
                )}

                {["DELIVERED", "COMPLETED"].includes(order.status) && (
                  <footer className="px-5 pb-5 md:px-6 md:pb-6">
                    <div className="flex flex-col gap-3 rounded-xl border border-[#5B48FC]/10 bg-[#EFEDFF]/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#D79900] shadow-sm">
                          <Star className="h-4 w-4 fill-[#D79900]" />
                        </span>
                        <div>
                          <p className="text-sm font-bold">Rate your experience</p>
                          <p className="text-xs font-medium text-gray-600">
                            Help others by sharing your feedback.
                          </p>
                        </div>
                      </div>
                      {order.review ? (
                        <span className="text-sm font-bold text-[#10B981]">
                          Review submitted ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => openReview(order)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5B48FC] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#4A38E0]"
                        >
                          <MessageSquare className="h-4 w-4" /> Leave a review
                        </button>
                      )}
                    </div>
                  </footer>
                )}
              </article>
            );
          })
        )}
      </div>

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0A0A0A]/40 px-4 py-8 backdrop-blur-sm">
          <div className="relative my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <button
              onClick={() => setReviewing(null)}
              className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-colors hover:bg-gray-200 hover:text-[#0F172A]"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-1 text-2xl font-extrabold">Leave a review</h2>
            <p className="mb-6 text-sm font-medium text-gray-500">
              Order #{reviewing.orderNumber}
            </p>

            <div className="mb-6">
              <label className="mb-3 block text-sm font-bold">
                Overall rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-100 text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-3 block text-sm font-bold">
                Written review{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Share details about the product, service, or seller…"
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium focus:border-[#5B48FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50"
              />
            </div>

            {reviewError && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-800">{reviewError}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row">
              <button
                onClick={() => setReviewing(null)}
                disabled={submitting}
                className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void submitReview()}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5B48FC] py-3 text-sm font-bold text-white transition-colors hover:bg-[#4A38E0] disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  "Submit review"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
