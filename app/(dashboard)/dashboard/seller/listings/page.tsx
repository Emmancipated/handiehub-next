"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AlertTriangle,
  Loader2,
  Package,
  Plus,
  Eye,
} from "lucide-react";

const PRIMARY = "#5B48FC";

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

const STATUS_TABS = ["ALL", "DRAFT", "PENDING_REVIEW", "ACTIVE", "ARCHIVED"] as const;

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

export default function SellerListingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("ALL");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const query = tab === "ALL" ? "" : `?status=${tab}`;
      const res = await fetch(`/api/listings/mine${query}`, {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings ?? []);
      }
    } finally {
      setFetching(false);
    }
  }, [tab]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    // Fetching on mount/filter change is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [user, loading, router, load]);

  const setStatus = async (listing: SellerListing, status: string) => {
    setBusyId(listing.id);
    setError("");
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not update the listing");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#5B48FC]" />
      </div>
    );
  }

  return (
    <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight md:text-3xl">
              My listings
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Manage drafts and published listings.
            </p>
          </div>
          <Link
            href="/dashboard/seller/listings/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white shadow-md"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus className="w-4 h-4" /> New listing
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setTab(status)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                tab === status
                  ? "text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              style={tab === status ? { backgroundColor: PRIMARY } : undefined}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {fetching ? (
            <div className="p-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#5B48FC]" />
            </div>
          ) : listings.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-[#0F172A]">No listings here</p>
              <p className="text-sm text-gray-500 font-medium">
                Try a different filter or create a new listing.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {listings.map((listing) => (
                <li
                  key={listing.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
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
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          STATUS_STYLES[listing.status] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {listing.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {listing.category?.name ?? "Uncategorised"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="font-bold text-[#0F172A]">
                      {money(listing.priceMinor, listing.currency)}
                    </p>
                    <Link
                      href={`/product/${listing.slug}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#5B48FC] hover:bg-[#EFEDFF]"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {listing.status === "DRAFT" || listing.status === "ARCHIVED" ? (
                      <button
                        type="button"
                        disabled={busyId === listing.id}
                        onClick={() => setStatus(listing, "ACTIVE")}
                        className="px-3 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        {busyId === listing.id ? "..." : "Publish"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === listing.id}
                        onClick={() => setStatus(listing, "DRAFT")}
                        className="px-3 py-2 rounded-lg text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                      >
                        {busyId === listing.id ? "..." : "Unpublish"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
    </div>
  );
}
