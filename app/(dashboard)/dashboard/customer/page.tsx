import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Heart,
  MessageSquare,
  Package,
  Star,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requirePageUser } from "@/lib/auth/guards";

const TERMINAL: ("COMPLETED" | "CANCELLED" | "REFUNDED")[] = [
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

const formatMoney = (minor: bigint | number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(minor) / 100);

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

export const instant = false;

export default async function CustomerOverviewPage() {
  const session = await requirePageUser();
  const buyerId = session.sub;

  const [
    productOrders,
    serviceOrders,
    unreadMessages,
    pendingReviews,
    recentOrders,
    nextBooking,
    savedCount,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        buyerId,
        status: { notIn: TERMINAL },
        items: { some: { listing: { kind: "PRODUCT" } } },
      },
    }),
    prisma.order.count({
      where: {
        buyerId,
        status: { notIn: TERMINAL },
        items: { some: { listing: { kind: "SERVICE" } } },
      },
    }),
    prisma.message.count({ where: { recipientId: buyerId, isRead: false } }),
    prisma.order.count({
      where: {
        buyerId,
        status: { in: ["DELIVERED", "COMPLETED"] },
        review: null,
      },
    }),
    prisma.order.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        items: { select: { titleSnapshot: true, quantity: true } },
        seller: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.order.findFirst({
      where: {
        buyerId,
        status: { notIn: TERMINAL },
        serviceSchedule: { gte: new Date() },
        items: { some: { listing: { kind: "SERVICE" } } },
      },
      orderBy: { serviceSchedule: "asc" },
      include: {
        items: { select: { titleSnapshot: true } },
        seller: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.savedListing.count({ where: { userId: buyerId } }),
  ]);

  const stats = [
    {
      label: "Active orders",
      value: productOrders,
      href: "/dashboard/customer/orders",
      icon: Package,
      tone: "bg-[#EFEDFF] text-[#5B48FC]",
    },
    {
      label: "Active bookings",
      value: serviceOrders,
      href: "/dashboard/customer/bookings",
      icon: CalendarCheck,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Unread messages",
      value: unreadMessages,
      href: "/messages",
      icon: MessageSquare,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Reviews to leave",
      value: pendingReviews,
      href: "/dashboard/customer/reviews",
      icon: Star,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="font-sans text-[#0F172A]">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          Overview
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          A quick look at your orders, bookings and messages.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-extrabold">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Package className="h-4 w-4 text-[#5B48FC]" /> Recent orders
            </h2>
            <Link
              href="/dashboard/customer/orders"
              className="flex items-center gap-1 text-sm font-bold text-[#5B48FC] hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="mx-auto mb-3 h-9 w-9 text-gray-300" />
              <p className="font-semibold">No orders yet</p>
              <p className="mb-4 text-sm font-medium text-gray-500">
                Browse products or hire a professional to get started.
              </p>
              <Link
                href="/categories"
                className="inline-flex rounded-xl bg-[#5B48FC] px-4 py-2 text-sm font-bold text-white hover:bg-[#4A38E0]"
              >
                Explore the marketplace
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {order.items.map((item) => item.titleSnapshot).join(", ")}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-gray-500">
                      #{order.orderNumber} ·{" "}
                      {[order.seller.firstName, order.seller.lastName]
                        .filter(Boolean)
                        .join(" ") || "Seller"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-sm font-extrabold">
                      {formatMoney(order.totalMinor, order.currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
              <CalendarCheck className="h-4 w-4 text-[#5B48FC]" /> Next booking
            </h2>
            {nextBooking?.serviceSchedule ? (
              <div>
                <p className="text-sm font-bold">
                  {nextBooking.items.map((item) => item.titleSnapshot).join(", ")}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  {new Date(nextBooking.serviceSchedule).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <Link
                  href="/dashboard/customer/bookings"
                  className="mt-3 inline-flex text-sm font-bold text-[#5B48FC] hover:underline"
                >
                  Manage booking
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-500">
                  No upcoming appointments.
                </p>
                <Link
                  href="/handieman"
                  className="mt-3 inline-flex text-sm font-bold text-[#5B48FC] hover:underline"
                >
                  Find a professional
                </Link>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
              <Heart className="h-4 w-4 text-[#5B48FC]" /> Saved items
            </h2>
            <p className="text-sm font-medium text-gray-500">
              {savedCount === 0
                ? "You have not saved anything yet."
                : `${savedCount} item${savedCount === 1 ? "" : "s"} on your wishlist.`}
            </p>
            <Link
              href="/dashboard/customer/saved"
              className="mt-3 inline-flex text-sm font-bold text-[#5B48FC] hover:underline"
            >
              View saved items
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
