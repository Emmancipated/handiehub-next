"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Loader2, Package, ArrowRight } from "lucide-react";

type SavedListing = {
  id: string;
  createdAt: string;
  listing: {
    id: string;
    slug: string;
    title: string;
    kind: "PRODUCT" | "SERVICE";
    priceMinor: bigint | number;
    currency: string;
    images: string[];
    category: { name: string } | null;
    seller: { firstName: string | null; lastName: string | null };
    reviewCount: number;
  };
};

const formatMoney = (minor: bigint | number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(minor) / 100);

export default function SavedPage() {
  const [saved, setSaved] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/saved", { credentials: "same-origin", signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load saved items.");
        setSaved(data.saved ?? []);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Could not load saved items.");
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const remove = async (listingId: string) => {
    setRemoving(listingId);
    try {
      const res = await fetch("/api/saved", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok) throw new Error("Could not remove this item.");
      setSaved((current) => current.filter((row) => row.listing.id !== listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove this item.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="font-sans text-[#0F172A]">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          Saved items
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Products and professionals you bookmarked for later.
        </p>
      </header>

      {error && (
        <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-[#5B48FC]" />
        </div>
      ) : saved.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Heart className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="mb-1 text-lg font-bold">Nothing saved yet</h2>
          <p className="mb-5 text-sm font-medium text-gray-500">
            Tap the heart on a product or service to keep it here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl bg-[#5B48FC] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#4A38E0]"
          >
            Browse products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((row) => {
            const listing = row.listing;
            const image = listing.images?.[0];
            return (
              <article
                key={row.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <Link href={`/product/${listing.slug}`} className="block">
                  <div className="flex h-40 items-center justify-center bg-gray-100">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    {listing.category?.name ?? listing.kind.toLowerCase()}
                  </p>
                  <Link
                    href={`/product/${listing.slug}`}
                    className="mt-1 block truncate text-sm font-bold hover:text-[#5B48FC]"
                  >
                    {listing.title}
                  </Link>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">
                    {[listing.seller.firstName, listing.seller.lastName]
                      .filter(Boolean)
                      .join(" ") || "Seller"}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-base font-extrabold">
                      {formatMoney(listing.priceMinor, listing.currency)}
                    </span>
                    <button
                      onClick={() => void remove(listing.id)}
                      disabled={removing === listing.id}
                      className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      aria-label={`Remove ${listing.title} from saved`}
                    >
                      {removing === listing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className="h-4 w-4 fill-current" />
                      )}
                    </button>
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
