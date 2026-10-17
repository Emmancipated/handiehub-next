"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  Filter,
  Grid,
  List,
  ArrowRight,
  Star,
  Wrench,
  Hammer,
  Sparkles,
  Baby,
  Flame,
  Zap,
  Paintbrush,
  TreePine,
  LayoutGrid,
  Sofa,
  PenTool,
  ShoppingBag,
  Briefcase,
} from "lucide-react";

// Added 'type' to distinguish if a category has services, products, or both
const CATEGORIES = [
  { id: "plumbing", name: "Plumbing", icon: Wrench, count: 24, type: "both" },
  {
    id: "furniture",
    name: "Furniture & Decor",
    icon: Sofa,
    count: 45,
    type: "product",
  },
  { id: "carpentry", name: "Carpentry", icon: Hammer, count: 18, type: "both" },
  {
    id: "cleaning",
    name: "Cleaning",
    icon: Sparkles,
    count: 32,
    type: "service",
  },
  {
    id: "nanny",
    name: "Nanny & Childcare",
    icon: Baby,
    count: 15,
    type: "service",
  },
  {
    id: "welding",
    name: "Welding & Metal",
    icon: Flame,
    count: 8,
    type: "both",
  },
  { id: "electrical", name: "Electrical", icon: Zap, count: 20, type: "both" },
  {
    id: "painting",
    name: "Painting & Supplies",
    icon: Paintbrush,
    count: 12,
    type: "both",
  },
  {
    id: "landscaping",
    name: "Landscaping",
    icon: TreePine,
    count: 10,
    type: "service",
  },
];

// ... (Keep the FEATURED_PRODUCTS mock data exactly the same as before) ...
const FEATURED_PRODUCTS = [
  {
    id: "1",
    name: "Ambience Black Chair",
    price: 24999,
    image:
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80",
    seller: "Ambience Furniture",
    rating: 4.8,
    reviews: 124,
  },
  {
    id: "2",
    name: "Modern Leather Sofa Set",
    price: 189999,
    image:
      "https://images.unsplash.com/photo-1555046833-cb90598087fe?w=600&q=80",
    seller: "Comfort Living",
    rating: 4.9,
    reviews: 89,
  },
];

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  // New state to toggle between Marketplace sides
  const [marketType, setMarketType] = useState<"all" | "service" | "product">(
    "all",
  );

  const filteredCategories = CATEGORIES.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      marketType === "all" || c.type === marketType || c.type === "both";
    return matchesSearch && matchesType;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredCategories.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="animate-fade-in-up group flex flex-col p-6 bg-white border border-gray-100 rounded-2xl hover:border-[#5B48FC]/30 hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-[#5B48FC] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  {/* Subtle badge showing if it has products, services, or both */}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-[#5B48FC] transition-colors">
                    {cat.type}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-[#0F172A] group-hover:text-[#5B48FC] transition-colors leading-tight mb-1">
                  {cat.name}
                </h3>

                {/* Updated Verbiage */}
                <p className="text-sm text-gray-500 font-medium">
                  {cat.count} listings
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
