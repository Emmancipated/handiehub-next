"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Filter,
  Grid,
  List,
  ShoppingCart,
  Star,
  ChevronDown,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const formatPrice = (minor: bigint | string | number) => {
  const val = typeof minor === "bigint" ? Number(minor) : Number(minor);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(val);
};

const MOCK_CATEGORY_PRODUCTS = [
  {
    id: "p1",
    name: "Ambience Black Chair",
    price: 24999,
    image:
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    seller: "Ambience Furniture",
    rating: 4.8,
    reviews: 223,
    isVerified: true,
    type: "product",
  },
  {
    id: "p2",
    name: "Modern Leather Sofa",
    price: 89999,
    image:
      "https://images.unsplash.com/photo-1555046833-cb90598087fe?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    seller: "Comfort Living",
    rating: 4.9,
    reviews: 156,
    isVerified: true,
    type: "product",
  },
  {
    id: "p3",
    name: "Master Plumber: Pipe Repair & Installation",
    price: 15000,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    seller: "FixIt Right Co.",
    rating: 5.0,
    reviews: 89,
    isVerified: true,
    type: "service",
  },
  {
    id: "p4",
    name: "Executive Office Desk Assembly",
    price: 75000,
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    seller: "OfficePro",
    rating: 4.4,
    reviews: 67,
    isVerified: false,
    type: "service",
  },
];

export default function CategoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("featured");

  const categoryName =
    typeof id === "string"
      ? id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      : "Category";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-24">
      {/* Animation Styles */}
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

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-4 sticky top-16 z-30 shadow-sm/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Title & Back Button */}
          <div className="flex items-center gap-4 animate-fade-in-up">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#0F172A] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                {categoryName}
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                {MOCK_CATEGORY_PRODUCTS.length} professionals and products
                available
              </p>
            </div>
          </div>

          {/* Toolbar: Views & Filters */}
          <div
            className="flex items-center gap-3 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            {/* View Toggle */}
            <div className="hidden sm:flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setView("grid")}
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
                className={`p-2 rounded-lg transition-all ${
                  view === "list"
                    ? "bg-white shadow-sm text-[#5B48FC]"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative group">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#5B48FC] focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 text-sm font-medium text-[#0F172A] appearance-none cursor-pointer transition-all shadow-sm w-full sm:w-auto"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#5B48FC] transition-colors" />
            </div>

            {/* Filter Button */}
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#5B48FC] text-gray-600 hover:text-[#5B48FC] transition-all shadow-sm font-medium text-sm">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_CATEGORY_PRODUCTS.map((item, index) => (
              <Link
                key={item.id}
                href={`/product/${item.id}`}
                className="animate-fade-in-up group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-sm text-[#0F172A] text-xs font-bold px-2.5 py-1.5 rounded-md shadow-sm">
                      {item.type === "service" ? "Service" : "Product"}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-700 truncate">
                      {item.seller}
                    </span>
                    {item.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-[#5B48FC]" />
                    )}
                  </div>

                  <h3 className="font-bold text-[#0F172A] text-lg leading-tight mb-3 group-hover:text-[#5B48FC] transition-colors line-clamp-2">
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-4">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-[#0F172A]">
                      {item.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({item.reviews} reviews)
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                        Starting at
                      </span>
                      <span className="text-lg font-extrabold text-[#0F172A]">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#5B48FC] group-hover:text-white text-gray-400 transition-colors duration-300">
                      {item.type === "product" ? (
                        <ShoppingCart className="w-4 h-4" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {MOCK_CATEGORY_PRODUCTS.map((item, index) => (
              <Link
                key={item.id}
                href={`/product/${item.id}`}
                className="animate-fade-in-up group flex flex-col sm:flex-row bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#5B48FC]/30 transition-all duration-300"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="relative sm:w-64 h-48 sm:h-auto overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0F172A] text-xs font-bold px-2.5 py-1.5 rounded-md shadow-sm sm:hidden">
                    {item.type === "service" ? "Service" : "Product"}
                  </span>
                </div>

                <div className="p-5 flex flex-col justify-between flex-grow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {item.seller}
                        </span>
                        {item.isVerified && (
                          <ShieldCheck className="w-4 h-4 text-[#5B48FC]" />
                        )}
                      </div>
                      <span className="hidden sm:inline-block bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md">
                        {item.type === "service" ? "Service" : "Product"}
                      </span>
                    </div>

                    <h3 className="font-bold text-xl text-[#0F172A] group-hover:text-[#5B48FC] transition-colors mb-2">
                      {item.name}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-4 sm:mb-0">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-[#0F172A]">
                        {item.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({item.reviews} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                        Starting at
                      </span>
                      <span className="text-2xl font-extrabold text-[#0F172A]">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <button className="px-6 py-2.5 rounded-xl bg-gray-50 text-gray-700 font-bold text-sm group-hover:bg-[#5B48FC] group-hover:text-white transition-colors duration-300 flex items-center gap-2">
                      {item.type === "product" ? "Add to Cart" : "Book Now"}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
