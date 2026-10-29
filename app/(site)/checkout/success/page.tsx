"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Package,
  ShoppingBag,
} from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalMinor: bigint | number;
  currency: string;
  serviceSchedule: string | null;
  items: { titleSnapshot: string; quantity: number }[];
  seller: { firstName: string | null; lastName: string | null } | null;
};

const formatMoney = (minor: bigint | number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(minor) / 100);

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) return;
    const controller = new AbortController();

    fetch(`/api/orders/${orderId}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load your order.");
        setOrder(data.order);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Could not load your order.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [orderId]);

  const isBooking = Boolean(order?.serviceSchedule);
  const sellerName = order?.seller
    ? [order.seller.firstName, order.seller.lastName].filter(Boolean).join(" ") ||
      "the seller"
    : "the seller";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-7 w-7 animate-spin text-[#5B48FC]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#F8FAFC] px-4 py-12 font-sans">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] md:text-3xl">
          Payment successful
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-gray-500">
          Your payment is held in escrow and {sellerName} has been notified. You
          can track everything from your dashboard.
        </p>
        <p className="mx-auto mt-2 max-w-sm text-xs font-medium text-amber-700">
          Your 6-digit delivery code is in your orders. Share it with the seller
          only when you receive your order.
        </p>

        {error && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-800">
            {error}
          </p>
        )}

        {order && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {isBooking ? "Booking" : "Order"}
                </p>
                <p className="text-lg font-extrabold">#{order.orderNumber}</p>
              </div>
              <p className="text-lg font-extrabold">
                {formatMoney(order.totalMinor, order.currency)}
              </p>
            </div>

            <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              {order.items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="truncate font-semibold">
                    {item.titleSnapshot}
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    Qty {item.quantity}
                  </span>
                </li>
              ))}
            </ul>

            {order.serviceSchedule && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#EFEDFF]/60 px-3 py-2 text-sm font-semibold text-[#5B48FC]">
                <CalendarCheck className="h-4 w-4" />
                {new Date(order.serviceSchedule).toLocaleString("en-NG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Link
            href={
              isBooking
                ? "/dashboard/customer/bookings"
                : "/dashboard/customer/orders"
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B48FC] py-3.5 text-sm font-bold text-white hover:bg-[#4A38E0]"
          >
            {isBooking ? (
              <CalendarCheck className="h-4 w-4" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            View {isBooking ? "my bookings" : "my orders"}
          </Link>
          <Link
            href="/products"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <ShoppingBag className="h-4 w-4" /> Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FAFC]">
          <Loader2 className="h-7 w-7 animate-spin text-[#5B48FC]" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
