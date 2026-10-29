"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Package,
  Truck,
  User,
} from "lucide-react";

type OrderKind = "PRODUCT" | "SERVICE";

type ApiOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalMinor: bigint | number;
  currency: string;
  serviceSchedule: string | null;
  createdAt: string;
  items: {
    titleSnapshot: string;
    quantity: number;
    listing?: { kind: OrderKind | null; slug: string | null } | null;
  }[];
  buyer: { firstName: string | null; lastName: string | null } | null;
};

type Order = Omit<ApiOrder, "totalMinor" | "items"> & {
  totalMinor: number;
  items: {
    titleSnapshot: string;
    quantity: number;
    kind: OrderKind | null;
    slug: string | null;
  }[];
};

const STATUS_STYLE: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-[#EFEDFF] text-[#5B48FC] border-[#5B48FC]/20",
  ACCEPTED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED: "bg-blue-50 text-blue-700 border-blue-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  DISPUTED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
  REFUNDED: "Refunded",
};

const formatMoney = (minor: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(minor / 100);

const toLocalInput = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const COPY = {
  PRODUCT: {
    title: "Orders",
    subtitle: "Accept orders, ship products and keep buyers updated.",
    empty: "No product orders yet.",
  },
  SERVICE: {
    title: "Bookings",
    subtitle: "Accept jobs, set the appointment time and mark work done.",
    empty: "No service bookings yet.",
  },
} satisfies Record<OrderKind, { title: string; subtitle: string; empty: string }>;

export default function SellerOrders({ kind }: { kind: OrderKind }) {
  const copy = COPY[kind];
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Record<string, string>>({});
  const [codes, setCodes] = useState<Record<string, string>>({});

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await fetch(
          `/api/orders/seller-orders?limit=100&kind=${kind}`,
          { credentials: "same-origin", signal },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load orders.");
        const mapped: Order[] = (data.orders ?? []).map((order: ApiOrder) => ({
          ...order,
          totalMinor: Number(order.totalMinor) / 100,
          items: (order.items ?? []).map((item) => ({
            titleSnapshot: item.titleSnapshot,
            quantity: item.quantity,
            kind: item.listing?.kind ?? null,
            slug: item.listing?.slug ?? null,
          })),
        }));
        setOrders(mapped);
        setSchedules(
          Object.fromEntries(
            mapped
              .filter((order) => order.serviceSchedule)
              .map((order) => [order.id, toLocalInput(order.serviceSchedule)]),
          ),
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load orders.");
      } finally {
        setLoading(false);
      }
    },
    [kind],
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const updateOrder = async (
    id: string,
    payload: { status?: string; deliveryDate?: string },
  ) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not update the order.");

      setOrders((current) =>
        current.map((order) =>
          order.id === id
            ? {
                ...order,
                status: data.order?.status ?? order.status,
                serviceSchedule:
                  data.order?.serviceSchedule ?? order.serviceSchedule,
              }
            : order,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the order.");
    } finally {
      setBusy(null);
    }
  };

  const confirmDelivery = async (orderId: string) => {
    const code = codes[orderId]?.trim();
    if (!/^\d{6}$/.test(code ?? "")) {
      setError("Enter the buyer's 6-digit delivery code.");
      return;
    }

    setBusy(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-delivery`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not confirm delivery.");

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status: data.order?.status ?? "COMPLETED" }
            : order,
        ),
      );
      setCodes((current) => ({ ...current, [orderId]: "" }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not confirm delivery.",
      );
    } finally {
      setBusy(null);
    }
  };

  const nextAction = (order: Order): { label: string; status: string } | null => {
    switch (order.status) {
      case "PAID":
        return { label: "Accept", status: "ACCEPTED" };
      case "ACCEPTED":
        return { label: "Start work", status: "IN_PROGRESS" };
      case "IN_PROGRESS":
        return kind === "SERVICE"
          ? null
          : { label: "Mark shipped", status: "SHIPPED" };
      default:
        return null;
    }
  };

  const isTerminal = (status: string) =>
    ["COMPLETED", "CANCELLED", "REFUNDED"].includes(status);

  return (
    <div className="font-sans text-[#0F172A]">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">{copy.subtitle}</p>
        </div>
        <Link
          href={
            kind === "SERVICE"
              ? "/dashboard/seller/listings/new"
              : "/dashboard/seller/listings"
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-[#5B48FC]/30 hover:text-[#5B48FC]"
        >
          <Package className="h-4 w-4" />
          {kind === "SERVICE" ? "Add a service" : "Manage listings"}
        </Link>
      </header>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-[#5B48FC]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <ClipboardList className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="mb-1 text-lg font-bold">Nothing to fulfil</h2>
          <p className="text-sm font-medium text-gray-500">{copy.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const action = nextAction(order);
            const canSchedule =
              kind === "SERVICE" &&
              !isTerminal(order.status) &&
              order.status !== "PENDING_PAYMENT";

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <header className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2.5">
                      <h2 className="text-base font-extrabold">
                        #{order.orderNumber}
                      </h2>
                      <span
                        className={`rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          STATUS_STYLE[order.status] ??
                          "border-gray-200 bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                      <User className="h-4 w-4 text-gray-400" />
                      {[order.buyer?.firstName, order.buyer?.lastName]
                        .filter(Boolean)
                        .join(" ") || "Buyer"}
                      <span className="text-gray-300">·</span>
                      {new Date(order.createdAt).toLocaleDateString("en-NG", {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <p className="text-xl font-extrabold">
                    {formatMoney(order.totalMinor, order.currency)}
                  </p>
                </header>

                <div className="space-y-3 p-5">
                  {order.items.map((item, index) => (
                    <div
                      key={`${order.id}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <span className="truncate text-sm font-bold">
                        {item.titleSnapshot}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        Qty {item.quantity}
                      </span>
                    </div>
                  ))}

                  {canSchedule && (
                    <div className="flex flex-col gap-2 rounded-xl border border-[#5B48FC]/15 bg-[#EFEDFF]/40 p-4 sm:flex-row sm:items-end">
                      <label className="flex-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                        Appointment
                        <input
                          type="datetime-local"
                          value={schedules[order.id] ?? ""}
                          onChange={(event) =>
                            setSchedules((current) => ({
                              ...current,
                              [order.id]: event.target.value,
                            }))
                          }
                          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-[#0F172A] focus:border-[#5B48FC] focus:outline-none"
                        />
                      </label>
                      <button
                        onClick={() =>
                          updateOrder(order.id, {
                            deliveryDate: new Date(
                              schedules[order.id],
                            ).toISOString(),
                          })
                        }
                        disabled={!schedules[order.id] || busy === order.id}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#5B48FC] shadow-sm ring-1 ring-[#5B48FC]/20 hover:bg-[#5B48FC] hover:text-white disabled:opacity-50"
                      >
                        <Calendar className="h-4 w-4" /> Save time
                      </button>
                    </div>
                  )}

                  {order.serviceSchedule && !canSchedule && (
                    <p className="flex items-center gap-2 text-sm font-semibold text-[#5B48FC]">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.serviceSchedule).toLocaleString("en-NG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  )}

                  {["IN_PROGRESS", "SHIPPED"].includes(order.status) && (
                    <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-end">
                      <label className="flex-1 text-xs font-bold uppercase tracking-wide text-amber-800">
                        Buyer delivery code
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={codes[order.id] ?? ""}
                          onChange={(event) =>
                            setCodes((current) => ({
                              ...current,
                              [order.id]: event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6),
                            }))
                          }
                          placeholder="6-digit code"
                          className="mt-1.5 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-bold tracking-[0.3em] text-[#0F172A] placeholder:font-normal placeholder:tracking-normal focus:border-[#5B48FC] focus:outline-none"
                        />
                      </label>
                      <button
                        onClick={() => void confirmDelivery(order.id)}
                        disabled={
                          busy === order.id ||
                          (codes[order.id] ?? "").length !== 6
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busy === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Complete order
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    {action ? (
                      <button
                        onClick={() => updateOrder(order.id, { status: action.status })}
                        disabled={busy === order.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#5B48FC] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4A38E0] disabled:opacity-60"
                      >
                        {busy === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : action.status === "SHIPPED" ? (
                          <Truck className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {action.label}
                      </button>
                    ) : order.status === "DELIVERED" ? (
                      <span className="text-sm font-medium text-gray-500">
                        Waiting for the buyer to confirm receipt.
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
