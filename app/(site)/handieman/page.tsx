"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  MessageSquare,
  CalendarCheck,
  Loader2,
} from "lucide-react";

type Seller = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string;
  description: string | null;
  avatarUrl: string | null;
  professions: string[];
  skills: string[];
  city: string | null;
  state: string | null;
  country: string;
  responseTime: string | null;
  responseTimeLabel: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  isTopSeller: boolean;
  memberSince: string;
  stats: {
    listingCount: number;
    reviewCount: number;
    averageRating: number | null;
  };
  startingPriceMinor: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Sort by: Newest" },
  { value: "rating", label: "Top Rated" },
  { value: "name", label: "Name: A–Z" },
];

const formatMoney = (minor: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(minor) / 100);

const sellerName = (seller: Seller) =>
  seller.businessName ||
  [seller.firstName, seller.lastName].filter(Boolean).join(" ") ||
  "HandieHub seller";

const sellerLocation = (seller: Seller) =>
  [seller.city, seller.state].filter(Boolean).join(", ") || seller.country;

function HandiemanContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const profession = searchParams.get("profession") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  const [searchInput, setSearchInput] = useState(q);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [professions, setProfessions] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: "12",
      sort,
    });
    if (q) params.set("q", q);
    if (profession) params.set("profession", profession);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    fetch(`/api/sellers?${params.toString()}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load sellers");
        return data;
      })
      .then((data) => {
        setSellers(data.sellers ?? []);
        setProfessions(data.professions ?? []);
        setPagination(
          data.pagination ?? { page, limit: 12, total: 0, totalPages: 0 },
        );
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err.message);
        setSellers([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, sort, q, profession]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in updates)) next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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
                Hire Professionals
              </h1>
              <p className="text-gray-500 text-lg">
                Connect with highly skilled, background-checked tradesmen near
                you.
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
                placeholder="Search by name or profession..."
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
                onClick={() => updateParams({ profession: null })}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  !profession
                    ? "bg-[#0F172A] text-white shadow-md"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#5B48FC] hover:text-[#5B48FC]"
                }`}
              >
                All Professionals
              </button>
              {professions.map((item) => (
                <button
                  key={item}
                  onClick={() => updateParams({ profession: item })}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    profession === item
                      ? "bg-[#0F172A] text-white shadow-md"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#5B48FC] hover:text-[#5B48FC]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative group">
                <select
                  value={sort}
                  onChange={(event) => updateParams({ sort: event.target.value })}
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
            Loading professionals…
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
        ) : sellers.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">
              No professionals found
            </h3>
            <p className="text-gray-500">
              We couldn&apos;t find anyone matching your current filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-[#5B48FC] font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sellers.map((seller, index) => (
              <Link
                key={seller.id}
                href={`/seller/${seller.id}`}
                className="animate-fade-in-up group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <div className="relative h-56 overflow-hidden bg-[#EFEDFF] border-b border-gray-100">
                  {seller.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={seller.avatarUrl}
                      alt={sellerName(seller)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-extrabold text-[#5B48FC]">
                      {sellerName(seller).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    {seller.isVerified && (
                      <span className="px-2.5 py-1.5 rounded-md bg-white/90 backdrop-blur-md text-[#0F172A] text-[10px] font-bold tracking-wide shadow-sm flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />{" "}
                        VERIFIED
                      </span>
                    )}
                    {seller.isTopSeller && (
                      <span className="px-2.5 py-1.5 rounded-md bg-[#0F172A]/80 backdrop-blur-md text-white text-[10px] font-bold tracking-wide shadow-sm">
                        TOP SELLER
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-[#0F172A] text-lg leading-tight group-hover:text-[#5B48FC] transition-colors">
                      {sellerName(seller)}
                    </h3>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-[#0F172A]">
                        {seller.stats.averageRating != null
                          ? seller.stats.averageRating.toFixed(1)
                          : "New"}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-[#5B48FC] mb-2">
                    {seller.professions[0] ?? "Professional"}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                    <MapPin className="w-3.5 h-3.5" /> {sellerLocation(seller)}
                    {(seller.responseTimeLabel || seller.responseTime) && (
                      <>
                        <span className="mx-1">•</span>
                        <Clock className="w-3.5 h-3.5" /> Replies{" "}
                        {seller.responseTimeLabel ?? seller.responseTime}
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {(seller.skills.length > 0
                      ? seller.skills
                      : seller.professions
                    )
                      .slice(0, 3)
                      .map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-bold tracking-wide"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>

                  <div className="pt-4 border-t border-gray-50 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 font-medium">
                        {seller.startingPriceMinor
                          ? "Starting at"
                          : "Active listings"}
                      </span>
                      <span className="text-lg font-extrabold text-[#0F172A]">
                        {seller.startingPriceMinor
                          ? formatMoney(seller.startingPriceMinor)
                          : seller.stats.listingCount}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          router.push(`/messages/${seller.id}`);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-100 text-gray-700 font-bold text-sm hover:border-[#5B48FC] hover:text-[#5B48FC] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          router.push(`/seller/${seller.id}`);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#5B48FC] text-white font-bold text-sm hover:bg-[#4A38E0] shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <CalendarCheck className="w-4 h-4" /> View
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && sellers.length > 0 && totalPages > 1 && (
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

export default function HandiemanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          Loading professionals…
        </div>
      }
    >
      <HandiemanContent />
    </Suspense>
  );
}
