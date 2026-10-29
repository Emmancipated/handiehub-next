"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Loader2, Package, Star } from "lucide-react";

type ApiOrder = {
  id: string;
  orderNumber: string;
  status: string;
  review: { id: string } | null;
  items: {
    titleSnapshot: string;
    listing?: { kind: "PRODUCT" | "SERVICE" | null } | null;
  }[];
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  listing: { title: string; slug: string } | null;
  seller: { firstName: string | null; lastName: string | null };
  order: { orderNumber: string } | null;
};

const Stars = ({ rating }: { rating: number }) => (
  <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((value) => (
      <Star
        key={value}
        className={`h-4 w-4 ${
          value <= rating
            ? "fill-amber-400 text-amber-400"
            : "fill-gray-100 text-gray-200"
        }`}
      />
    ))}
  </span>
);

export default function ReviewsPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch("/api/orders/my-orders?limit=100", {
        credentials: "same-origin",
        signal: controller.signal,
      }).then((res) => (res.ok ? res.json() : { orders: [] })),
      fetch("/api/reviews/mine?limit=50", {
        credentials: "same-origin",
        signal: controller.signal,
      }).then((res) => (res.ok ? res.json() : { reviews: [] })),
    ])
      .then(([orderData, reviewData]) => {
        setOrders(orderData.orders ?? []);
        setReviews(reviewData.reviews ?? []);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setError("Could not load your reviews.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const pending = useMemo(
    () =>
      orders.filter(
        (order) =>
          ["DELIVERED", "COMPLETED"].includes(order.status) && !order.review,
      ),
    [orders],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-[#5B48FC]" />
      </div>
    );
  }

  return (
    <div className="font-sans text-[#0F172A]">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          Reviews
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Leave feedback for completed jobs and see what you have written.
        </p>
      </header>

      {error && (
        <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold">
          Waiting for your review ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-5 text-sm font-medium text-gray-500">
            Nothing pending. Completed orders will appear here until you review
            them.
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((order) => {
              const isService = order.items.some(
                (item) => item.listing?.kind === "SERVICE",
              );
              return (
                <li
                  key={order.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EFEDFF] text-[#5B48FC]">
                      {isService ? (
                        <CalendarCheck className="h-5 w-5" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {order.items.map((item) => item.titleSnapshot).join(", ")}
                      </p>
                      <p className="text-xs font-medium text-gray-500">
                        #{order.orderNumber}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={
                      isService
                        ? "/dashboard/customer/bookings"
                        : "/dashboard/customer/orders"
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-[#5B48FC] px-4 py-2 text-sm font-bold text-white hover:bg-[#4A38E0]"
                  >
                    Leave a review
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold">
          Your reviews ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-5 text-sm font-medium text-gray-500">
            You have not written any reviews yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">
                      {review.listing?.title ?? "Listing"}
                    </p>
                    <p className="text-xs font-medium text-gray-500">
                      {[review.seller.firstName, review.seller.lastName]
                        .filter(Boolean)
                        .join(" ") || "Seller"}
                      {review.order?.orderNumber
                        ? ` · #${review.order.orderNumber}`
                        : ""}
                    </p>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm font-medium leading-relaxed text-gray-600">
                    {review.comment}
                  </p>
                )}
                <p className="mt-3 text-xs font-medium text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString("en-NG", {
                    dateStyle: "medium",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
