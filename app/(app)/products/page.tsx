"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

// --- Mock Data specific to physical goods ---
const CATEGORY_FILTERS = [
  "All Products",
  "Furniture",
  "Tools",
  "Building Materials",
  "Plumbing Supplies",
  "Paint",
];

const MOCK_PRODUCTS = [
  {
    id: "p1",
    slug: "industrial-workbench",
    name: "Heavy Duty Industrial Workbench",
    price: 85000,
    category: "Tools",
    rating: 4.8,
    reviews: 45,
    seller: "MetalCrafters",
    isVerified: true,
    image:
      "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&q=80",
  },
  {
    id: "p2",
    slug: "leather-sofa",
    name: "Premium Leather 3-Seater Sofa",
    price: 189000,
    category: "Furniture",
    rating: 4.9,
    reviews: 124,
    seller: "Comfort Living",
    isVerified: true,
    image:
      "https://images.unsplash.com/photo-1555046833-cb90598087fe?w=600&q=80",
  },
  {
    id: "p3",
    slug: "bathroom-faucet",
    name: "Matte Black Modern Sink Faucet",
    price: 32000,
    category: "Plumbing Supplies",
    rating: 4.6,
    reviews: 89,
    seller: "PlumbSupplies",
    isVerified: false,
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80",
  },
  {
    id: "p4",
    slug: "paint-set",
    name: "Premium Wall Paint Set (20L)",
    price: 45000,
    category: "Paint",
    rating: 4.7,
    reviews: 56,
    seller: "ColorPro Paints",
    isVerified: true,
    image:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80",
  },
  {
    id: "p5",
    slug: "cordless-drill",
    name: "20V Max Cordless Drill Combo Kit",
    price: 55000,
    category: "Tools",
    rating: 4.9,
    reviews: 312,
    seller: "ToolHub Direct",
    isVerified: true,
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  },
  {
    id: "p6",
    slug: "ceramic-tiles",
    name: "Matte Finish Ceramic Floor Tiles (Per SQM)",
    price: 8500,
    category: "Building Materials",
    rating: 4.5,
    reviews: 112,
    seller: "BuildIt Right",
    isVerified: true,
    image:
      "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=600&q=80",
  },
  {
    id: "p7",
    slug: "dining-table",
    name: "Solid Oak Dining Table (6-Seater)",
    price: 145000,
    category: "Furniture",
    rating: 4.8,
    reviews: 67,
    seller: "WoodWorks Nigeria",
    isVerified: true,
    image:
      "https://images.unsplash.com/photo-1533731822071-d6d1f79d2e40?w=600&q=80",
  },
  {
    id: "p8",
    slug: "pvc-pipes",
    name: "Heavy Duty PVC Piping Bundle",
    price: 12000,
    category: "Plumbing Supplies",
    rating: 4.4,
    reviews: 34,
    seller: "PlumbSupplies",
    isVerified: false,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80",
  },
];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [sort, setSort] = useState("featured");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Filter Logic
  const filteredProducts = MOCK_PRODUCTS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.seller.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All Products" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-24">
      {/* Animation Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `,
        }}
      />

      {/* 1. Page Header */}
      <div className="bg-white border-b border-gray-200 pt-10 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                Shop Materials & Goods
              </h1>
              <p className="text-gray-500 text-lg">
                Browse premium tools, furniture, and supplies from verified
                sellers.
              </p>
            </div>

            {/* Search Bar */}
            <div
              className="animate-fade-in-up relative w-full md:w-80"
              style={{ animationDelay: "100ms" }}
            >
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products or sellers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all text-sm font-medium shadow-sm"
              />
            </div>
          </div>

          {/* 2. Horizontal Filter Toolbar */}
          <div
            className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100"
            style={{ animationDelay: "150ms" }}
          >
            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-grow">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-[#0F172A] text-white shadow-md"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#5B48FC] hover:text-[#5B48FC]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort & Advanced Filters */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative group">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#5B48FC] focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 text-sm font-medium text-[#0F172A] appearance-none cursor-pointer transition-all shadow-sm w-full sm:w-auto"
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#5B48FC] transition-colors" />
              </div>

              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#5B48FC] text-gray-600 hover:text-[#5B48FC] transition-all shadow-sm font-medium text-sm">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              We couldn't find anything matching your current filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All Products");
              }}
              className="mt-4 text-[#5B48FC] font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="animate-fade-in-up group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 border-b border-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {/* Category Tag overlay */}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0F172A] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md shadow-sm">
                    {product.category}
                  </span>
                </div>

                {/* Content Container */}
                <div className="p-5 flex flex-col flex-grow">
                  {/* Seller Info */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                      {product.seller}
                    </span>
                    {product.isVerified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#5B48FC]" />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-[#0F172A] text-lg leading-tight mb-3 group-hover:text-[#5B48FC] transition-colors line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-[#0F172A]">
                      {product.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({product.reviews})
                    </span>
                  </div>

                  {/* Footer: Price & Add to Cart */}
                  <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-[#0F172A]">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    {/* Add to Cart Button (Micro-interaction focus) */}
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // Prevent navigating to the product page when clicking the cart
                        // Cart logic here
                      }}
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

        {/* Load More (Visual only) */}
        {filteredProducts.length > 0 && (
          <div
            className="mt-12 flex justify-center animate-fade-in-up"
            style={{ animationDelay: "600ms" }}
          >
            <button className="px-8 py-3 rounded-full border-2 border-gray-200 text-gray-700 font-bold hover:border-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-all duration-300">
              Load More Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
