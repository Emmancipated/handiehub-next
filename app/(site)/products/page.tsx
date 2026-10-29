"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

type Listing = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceMinor: string;
  currency: string;
  kind: "PRODUCT" | "SERVICE";
  images: string[];
  category: { id: string; name: string; slug: string };
  seller: { id: string; firstName: string | null; lastName: string | null };
  ratingAvg: number;
  reviewCount: number;
};

type Category = { id: string; name: string; slug: string };

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Sort by: Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Most Reviewed" },
];

const formatPrice = (minor: string, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(minor) / 100);

const sellerName = (seller: Listing["seller"]) =>
  [seller.firstName, seller.lastName].filter(Boolean).join(" ") || "Seller";

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const kind = searchParams.get("kind") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  const [searchInput, setSearchInput] = useState(q);
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep the input in sync when the URL changes (back/forward, clear filters).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/listings/categories?limit=100", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories) setCategories(data.categories);
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "12");
    params.set("sort", sort);
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (kind) params.set("kind", kind);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    fetch(`/api/listings?${params.toString()}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load listings");
        return data;
      })
      .then((data) => {
        setListings(data.listings ?? []);
        setPagination(
          data.pagination ?? { page, limit: 12, total: 0, totalPages: 0 },
        );
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err.message);
        setListings([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, sort, q, category, kind]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in updates)) params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateParams({ q: searchInput.trim() || null });
  };

  const clearFilters = () => {
    setSearchInput("");
    router.replace(pathname, { scroll: false });
  };

  const totalPages = Math.max(1, pagination.totalPages);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-24">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `,
        }}
      />

      <div className="bg-white border-b border-gray-200 pt-10 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                Shop Materials &amp; Goods
              </h1>
              <p className="text-gray-500 text-lg">
                Browse premium tools, furniture, and supplies from verified
                sellers.
              </p>
            </div>

            <form
              onSubmit={submitSearch}
              className="animate-fade-in-up relative w-full md:w-80"
              style={{ animationDelay: "100ms" }}
            >
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products or sellers..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all text-sm font-medium shadow-sm"
              />
            </form>
          </div>

          <div
            className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100"
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-grow">
              <button
                onClick={() =>
                  updateParams({ category: null, kind: null })
                }
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  !category && !kind
                    ? "bg-[#0F172A] text-white shadow-md"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#5B48FC] hover:text-[#5B48FC]"
                }`}
              >
                All Products
              </button>
              <button
                onClick={() =>
                  updateParams({
                    kind: kind === "PRODUCT" ? null : "PRODUCT",
                    category: null,
                  })
                }
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  kind === "PRODUCT"
                    ? "bg-[#0F172A] text-white shadow-md"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#5B48FC] hover:text-[#5B48FC]"
                }`}
              >
                Goods
              </button>
              <button
                onClick={() =>
                  updateParams({
                    kind: kind === "SERVICE" ? null : "SERVICE",
                    category: null,
                  })
                }
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  kind === "SERVICE"
                    ? "bg-[#0F172A] text-white shadow-md"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#5B48FC] hover:text-[#5B48FC]"
                }`}
              >
                Services
              </button>
              {categories.map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateParams({ category: item.slug })}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    category === item.slug
                      ? "bg-[#0F172A] text-white shadow-md"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#5B48FC] hover:text-[#5B48FC]"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative group">
                <select
                  value={sort}
                  onChange={(event) =>
                    updateParams({ sort: event.target.value })
                  }
                  className="pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#5B48FC] focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 text-sm font-medium text-[#0F172A] appearance-none cursor-pointer transition-all shadow-sm w-full sm:w-auto"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#5B48FC] transition-colors" />
              </div>

              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#5B48FC] text-gray-600 hover:text-[#5B48FC] transition-all shadow-sm font-medium text-sm"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            Loading listings…
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-500">{error}</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-[#5B48FC] font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              We couldn&apos;t find anything matching your current filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-[#5B48FC] font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing, index) => (
              <Link
                key={listing.id}
                href={`/product/${listing.slug}`}
                className="animate-fade-in-up group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 border-b border-gray-100">
                  {listing.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0F172A] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md shadow-sm">
                    {listing.category.name}
                  </span>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                      {sellerName(listing.seller)}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#0F172A] text-lg leading-tight mb-3 group-hover:text-[#5B48FC] transition-colors line-clamp-2">
                    {listing.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-4">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-[#0F172A]">
                      {listing.ratingAvg > 0
                        ? listing.ratingAvg.toFixed(1)
                        : "New"}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({listing.reviewCount})
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-[#0F172A]">
                        {formatPrice(listing.priceMinor, listing.currency)}
                      </span>
                    </div>
                    <button
                      onClick={(event) => {
                        event.preventDefault();
                        // Cart is not persisted yet; the detail page handles checkout.
                      }}
                      aria-label={`Add ${listing.title} to cart`}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EFEDFF] text-[#5B48FC] group-hover:bg-[#5B48FC] group-hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && listings.length > 0 && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              onClick={() => updateParams({ page: String(page - 1) })}
              disabled={page <= 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-200 text-gray-700 font-bold hover:border-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm font-semibold text-gray-500">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              onClick={() => updateParams({ page: String(page + 1) })}
              disabled={page >= totalPages}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-200 text-gray-700 font-bold hover:border-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          Loading products…
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
