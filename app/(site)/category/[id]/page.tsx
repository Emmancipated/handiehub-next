"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Grid,
  List,
  ShoppingCart,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
} from "lucide-react";

type Listing = {
  id: string;
  slug: string;
  title: string;
  priceMinor: string;
  currency: string;
  kind: "PRODUCT" | "SERVICE";
  images: string[];
  category: { id: string; name: string; slug: string };
  seller: { id: string; firstName: string | null; lastName: string | null };
  ratingAvg: number;
  reviewCount: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  parent?: { id: string; slug: string; name: string } | null;
  children?: { id: string; slug: string; name: string }[];
};

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

const prettifySlug = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function CategoryContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categorySlug = Array.isArray(params.id) ? params.id[0] : params.id;
  const sort = searchParams.get("sort") ?? "newest";
  const kind = searchParams.get("kind") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [category, setCategory] = useState<Category | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categorySlug) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      page: String(page),
      limit: "12",
      sort,
    });
    if (kind) query.set("kind", kind);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    fetch(`/api/listings/category/${categorySlug}?${query.toString()}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load category");
        return data;
      })
      .then((data) => {
        setCategory(data.category ?? null);
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
  }, [categorySlug, page, sort, kind]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in updates)) next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const categoryName = category?.name ?? (categorySlug ? prettifySlug(categorySlug) : "Category");
  const totalPages = Math.max(1, pagination.totalPages);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-24">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `,
        }}
      />

      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-4 sticky top-16 z-30 shadow-sm/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 animate-fade-in-up">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#0F172A] transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                {categoryName}
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                {pagination.total} {pagination.total === 1 ? "listing" : "listings"} available
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <div className="hidden sm:flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={`p-2 rounded-lg transition-all ${
                  view === "grid"
                    ? "bg-white shadow-sm text-[#5B48FC]"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className={`p-2 rounded-lg transition-all ${
                  view === "list"
                    ? "bg-white shadow-sm text-[#5B48FC]"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <select
              value={kind}
              onChange={(event) =>
                updateParams({ kind: event.target.value || null })
              }
              className="pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#5B48FC] focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 text-sm font-medium text-[#0F172A] cursor-pointer transition-all shadow-sm"
              aria-label="Filter by type"
            >
              <option value="">All types</option>
              <option value="PRODUCT">Products</option>
              <option value="SERVICE">Services</option>
            </select>

            <div className="relative group">
              <select
                value={sort}
                onChange={(event) =>
                  updateParams({ sort: event.target.value })
                }
                className="pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#5B48FC] focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 text-sm font-medium text-[#0F172A] appearance-none cursor-pointer transition-all shadow-sm w-full sm:w-auto"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#5B48FC] transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {!loading && category && (category.parent || (category.children?.length ?? 0) > 0) && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="flex flex-wrap gap-2">
            {category.parent && (
              <Link
                href={`/category/${category.parent.slug}`}
                className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-[#5B48FC] hover:text-[#5B48FC] transition-colors"
              >
                ← All {category.parent.name}
              </Link>
            )}
            {category.children?.map((child) => (
              <Link
                key={child.id}
                href={`/category/${child.slug}`}
                className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-[#5B48FC] hover:text-[#5B48FC] transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            Loading listings…
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">
              {error === "Category not found"
                ? "Category not found"
                : "Could not load this category"}
            </h3>
            <p className="text-gray-500">{error}</p>
            <Link
              href="/products"
              className="mt-4 inline-block text-[#5B48FC] font-semibold hover:underline"
            >
              Browse all products
            </Link>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">
              Nothing here yet
            </h3>
            <p className="text-gray-500">
              There are no active listings in this category.
            </p>
            <Link
              href="/products"
              className="mt-4 inline-block text-[#5B48FC] font-semibold hover:underline"
            >
              Browse all products
            </Link>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((item, index) => (
              <Link
                key={item.id}
                href={`/product/${item.slug}`}
                className="animate-fade-in-up group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  {item.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-sm text-[#0F172A] text-xs font-bold px-2.5 py-1.5 rounded-md shadow-sm">
                      {item.kind === "SERVICE" ? "Service" : "Product"}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-700 truncate">
                      {sellerName(item.seller)}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#0F172A] text-lg leading-tight mb-3 group-hover:text-[#5B48FC] transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-4">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-[#0F172A]">
                      {item.ratingAvg > 0 ? item.ratingAvg.toFixed(1) : "New"}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({item.reviewCount} reviews)
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                        Starting at
                      </span>
                      <span className="text-lg font-extrabold text-[#0F172A]">
                        {formatPrice(item.priceMinor, item.currency)}
                      </span>
                    </div>
                    <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#5B48FC] group-hover:text-white text-gray-400 transition-colors duration-300">
                      {item.kind === "PRODUCT" ? (
                        <ShoppingCart className="w-4 h-4" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {listings.map((item, index) => (
              <Link
                key={item.id}
                href={`/product/${item.slug}`}
                className="animate-fade-in-up group flex flex-col sm:flex-row bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#5B48FC]/30 transition-all duration-300"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="relative sm:w-64 h-48 sm:h-auto overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0F172A] text-xs font-bold px-2.5 py-1.5 rounded-md shadow-sm sm:hidden">
                    {item.kind === "SERVICE" ? "Service" : "Product"}
                  </span>
                </div>

                <div className="p-5 flex flex-col justify-between flex-grow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {sellerName(item.seller)}
                      </span>
                      <span className="hidden sm:inline-block bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md">
                        {item.kind === "SERVICE" ? "Service" : "Product"}
                      </span>
                    </div>

                    <h3 className="font-bold text-xl text-[#0F172A] group-hover:text-[#5B48FC] transition-colors mb-2">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-4 sm:mb-0">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-[#0F172A]">
                        {item.ratingAvg > 0 ? item.ratingAvg.toFixed(1) : "New"}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({item.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                        Starting at
                      </span>
                      <span className="text-2xl font-extrabold text-[#0F172A]">
                        {formatPrice(item.priceMinor, item.currency)}
                      </span>
                    </div>
                    <span className="px-6 py-2.5 rounded-xl bg-gray-50 text-gray-700 font-bold text-sm group-hover:bg-[#5B48FC] group-hover:text-white transition-colors duration-300 flex items-center gap-2">
                      {item.kind === "PRODUCT" ? "View Product" : "View Service"}
                      <ArrowRight className="w-4 h-4" />
                    </span>
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

export default function CategoryDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          Loading category…
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
