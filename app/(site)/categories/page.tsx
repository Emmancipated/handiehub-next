"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  LayoutGrid,
  Sofa,
  Laptop,
  ShoppingBag,
  HeartPulse,
  Car,
  Building2,
  Briefcase,
  GraduationCap,
  PartyPopper,
  Sprout,
  HardHat,
  PenTool,
  Plane,
  Baby,
  Wrench,
} from "lucide-react";

type SubCategory = { id: string; slug: string; name: string };

type Category = {
  id: string;
  slug: string;
  name: string;
  stats: { listings: number; products: number; services: number };
  children?: SubCategory[];
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  home_kitchen: Sofa,
  electronics_technology: Laptop,
  fashion_beauty: ShoppingBag,
  health_wellness: HeartPulse,
  automobiles: Car,
  real_estate_property: Building2,
  business_professional_services: Briefcase,
  education_training: GraduationCap,
  events_entertainment: PartyPopper,
  agriculture_food: Sprout,
  construction_engineering: HardHat,
  freelance_digital_services: PenTool,
  travel_hospitality: Plane,
  kids_babies: Baby,
  other_services: Wrench,
};

const categoryType = (category: Category) => {
  const { products, services } = category.stats;
  if (products > 0 && services > 0) return "both";
  if (products > 0) return "product";
  if (services > 0) return "service";
  return "both";
};

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [marketType, setMarketType] = useState<"all" | "service" | "product">(
    "all",
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/listings/categories?limit=100", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load categories");
        return data;
      })
      .then((data) => {
        setCategories(data.categories ?? []);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err.message);
        setCategories([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const filteredCategories = categories.filter((category) => {
    const term = search.toLowerCase();
    const matchesSearch =
      category.name.toLowerCase().includes(term) ||
      (category.children ?? []).some((child) =>
        child.name.toLowerCase().includes(term),
      );
    const type = categoryType(category);
    const matchesType =
      marketType === "all" || type === marketType || type === "both";
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-24">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `,
        }}
      />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 pt-10 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                Explore Directory
              </h1>
              <p className="text-gray-500 text-lg">
                Browse our marketplace for trusted professionals and premium
                materials.
              </p>
            </div>

            {/* Controls */}
            <div
              className="animate-fade-in-up flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto"
              style={{ animationDelay: "100ms" }}
            >
              {/* Marketplace Toggle (Services vs Products) */}
              <div className="flex w-full sm:w-auto bg-gray-50 border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setMarketType("all")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${marketType === "all" ? "bg-white shadow-sm text-[#0F172A]" : "text-gray-500 hover:text-gray-900"}`}
                >
                  All
                </button>
                <button
                  onClick={() => setMarketType("service")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${marketType === "service" ? "bg-white shadow-sm text-[#5B48FC]" : "text-gray-500 hover:text-gray-900"}`}
                >
                  <Briefcase className="w-4 h-4" /> Pros
                </button>
                <button
                  onClick={() => setMarketType("product")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${marketType === "product" ? "bg-white shadow-sm text-[#5B48FC]" : "text-gray-500 hover:text-gray-900"}`}
                >
                  <ShoppingBag className="w-4 h-4" /> Products
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all text-sm font-medium"
                />
              </div>

              <div className="hidden sm:flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-white shadow-sm text-[#5B48FC]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  aria-label="List view"
                  className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-white shadow-sm text-[#5B48FC]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-40 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-bold mb-2">Could not load categories</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <h3 className="text-xl font-bold mb-2">No categories found</h3>
            <p className="text-gray-500">
              Try a different search or marketplace filter.
            </p>
          </div>
        ) : (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
                : "grid grid-cols-1 sm:grid-cols-2 gap-4"
            }
          >
            {filteredCategories.map((cat, index) => {
              const Icon = CATEGORY_ICONS[cat.slug] ?? LayoutGrid;
              const type = categoryType(cat);
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className={`animate-fade-in-up group flex bg-white border border-gray-100 rounded-2xl hover:border-[#5B48FC]/30 hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1 transition-all duration-300 ${
                    view === "grid"
                      ? "flex-col p-6"
                      : "items-center gap-5 p-5"
                  }`}
                  style={{ animationDelay: `${150 + index * 40}ms` }}
                >
                  <div
                    className={`rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-[#5B48FC] group-hover:text-white group-hover:scale-110 transition-all duration-300 ${
                      view === "grid" ? "w-12 h-12 mb-5" : "w-12 h-12 flex-shrink-0"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className={view === "grid" ? "" : "min-w-0"}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-lg text-[#0F172A] group-hover:text-[#5B48FC] transition-colors leading-tight truncate">
                        {cat.name}
                      </h3>
                      {view === "grid" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-[#5B48FC] transition-colors flex-shrink-0">
                          {type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                      {cat.stats.listings} listing
                      {cat.stats.listings === 1 ? "" : "s"}
                      {cat.children?.length
                        ? ` • ${cat.children.length} subcategor${cat.children.length === 1 ? "y" : "ies"}`
                        : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
