"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  LayoutGrid,
  Loader2,
  Package,
  Plus,
  Star,
  Wallet,
} from "lucide-react";

const PRIMARY = "#5B48FC";

type Stats = {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: string;
  reviewsReceived: number;
  averageRating: number;
};

type SellerListing = {
  id: string;
  title: string;
  slug: string;
  status: string;
  priceMinor: string;
  currency: string;
  images: string[];
  category?: { name: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-[#10B981]/10 text-[#10B981]",
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-600",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

function money(amount: string, currency = "NGN") {
  const value = Number(amount) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [complete, setComplete] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [fetching, setFetching] = useState(true);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const [profileRes, statsRes, listingsRes] = await Promise.all([
        fetch("/api/seller/profile", { credentials: "same-origin" }),
        fetch("/api/orders/overview/stats", { credentials: "same-origin" }),
        fetch("/api/listings/mine?limit=6", { credentials: "same-origin" }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setComplete(Boolean(data.complete));
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats ?? null);
      }
      if (listingsRes.ok) {
        const data = await listingsRes.json();
        setListings(data.listings ?? []);
      }
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    // Fetching on mount/login is intentional; the loader flag is set inside.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [user, loading, router, load]);

  if (loading || fetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#5B48FC]" />
      </div>
    );
  }

  return (
    <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight md:text-3xl">
              Overview
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Revenue, orders and your storefront at a glance.
            </p>
          </div>
          <Link
            href="/dashboard/seller/listings/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus className="w-4 h-4" /> New listing
          </Link>
        </div>

        {complete === false && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">
                  Finish your seller onboarding
                </p>
                <p className="text-sm text-amber-800 font-medium">
                  You need a complete profile before you can publish listings.
                </p>
              </div>
            </div>
            <Link
              href="/seller/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white whitespace-nowrap"
              style={{ backgroundColor: PRIMARY }}
            >
              Continue setup <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Package className="w-5 h-5 text-[#5B48FC]" />}
            label="Total orders"
            value={stats ? String(stats.totalOrders) : "—"}
          />
          <StatCard
            icon={<BadgeCheck className="w-5 h-5 text-[#10B981]" />}
            label="Completed"
            value={stats ? String(stats.completedOrders) : "—"}
          />
          <StatCard
            icon={<Wallet className="w-5 h-5 text-[#5B48FC]" />}
            label="Revenue"
            value={stats ? money(stats.totalRevenue) : "—"}
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-amber-500" />}
            label="Rating"
            value={
              stats
                ? stats.averageRating
                  ? `${stats.averageRating} (${stats.reviewsReceived})`
                  : "No reviews"
                : "—"
            }
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#5B48FC]" /> Recent listings
            </h2>
            <Link
              href="/dashboard/seller/listings"
              className="text-sm font-bold text-[#5B48FC] hover:underline"
            >
              View all
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-[#0F172A]">
                No listings yet
              </p>
              <p className="text-sm text-gray-500 font-medium mb-4">
                Create your first listing to start selling.
              </p>
              <Link
                href="/dashboard/seller/listings/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white"
                style={{ backgroundColor: PRIMARY }}
              >
                <Plus className="w-4 h-4" /> Create listing
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {listings.map((listing) => (
                <li
                  key={listing.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0F172A] truncate">
                      {listing.title}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {listing.category?.name ?? "Uncategorised"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#0F172A]">
                      {money(listing.priceMinor, listing.currency)}
                    </p>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        STATUS_STYLES[listing.status] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {listing.status.replace("_", " ")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="w-10 h-10 rounded-xl bg-[#EFEDFF] flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wide font-bold text-gray-400">
        {label}
      </p>
      <p className="text-xl font-extrabold text-[#0F172A] mt-1">{value}</p>
    </div>
  );
}
