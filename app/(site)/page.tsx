"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  Star,
  ShieldCheck,
  Wrench,
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
  CheckCircle,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  home_kitchen: <Sofa className="w-5 h-5" />,
  electronics_technology: <Laptop className="w-5 h-5" />,
  fashion_beauty: <ShoppingBag className="w-5 h-5" />,
  health_wellness: <HeartPulse className="w-5 h-5" />,
  automobiles: <Car className="w-5 h-5" />,
  real_estate_property: <Building2 className="w-5 h-5" />,
  business_professional_services: <Briefcase className="w-5 h-5" />,
  education_training: <GraduationCap className="w-5 h-5" />,
  events_entertainment: <PartyPopper className="w-5 h-5" />,
  agriculture_food: <Sprout className="w-5 h-5" />,
  construction_engineering: <HardHat className="w-5 h-5" />,
  freelance_digital_services: <PenTool className="w-5 h-5" />,
  travel_hospitality: <Plane className="w-5 h-5" />,
  kids_babies: <Baby className="w-5 h-5" />,
  other_services: <Wrench className="w-5 h-5" />,
};

type Category = { id: string; name: string; slug: string };

type Listing = {
  id: string;
  slug: string;
  title: string;
  priceMinor: string;
  currency: string;
  kind: "PRODUCT" | "SERVICE";
  images: string[];
  ratingAvg: number;
  reviewCount: number;
  seller: { id: string; firstName: string | null; lastName: string | null };
};

type Seller = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string;
  avatarUrl: string | null;
  professions: string[];
  isVerified: boolean;
  stats: { averageRating: number | null; reviewCount: number };
};

const formatPrice = (minor: string, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(minor) / 100);

const sellerName = (seller: Seller) =>
  seller.businessName ||
  [seller.firstName, seller.lastName].filter(Boolean).join(" ") ||
  "HandieHub seller";

function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-72 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [services, setServices] = useState<Listing[]>([]);
  const [products, setProducts] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      const get = async (url: string) => {
        const res = await fetch(url, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        return res.ok ? res.json() : null;
      };

      try {
        const [categoryData, sellerData, serviceData, productData] =
          await Promise.all([
            get("/api/listings/categories?limit=6"),
            get("/api/sellers?limit=4&sort=rating"),
            get("/api/listings?kind=SERVICE&limit=4&sort=rating"),
            get("/api/listings?kind=PRODUCT&limit=4&sort=newest"),
          ]);

        if (controller.signal.aborted) return;
        setCategories(categoryData?.categories ?? []);
        setSellers(sellerData?.sellers ?? []);
        setServices(serviceData?.listings ?? []);
        setProducts(productData?.listings ?? []);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Home fetch error:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, []);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  };

  return (
    <div className="min-h-screen bg-white text-[#131313] font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes breathe { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
        .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-breathe { animation: breathe 10s ease-in-out infinite; }
      `,
        }}
      />

      {/* 1. Hero Section */}
      <section className="relative bg-[#0A0A0A] text-white pt-28 pb-32 px-4 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1504148455328-c376907d081c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
            alt="Craftsmanship"
            className="w-full h-full object-cover opacity-15 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent"></div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-[#5B48FC]/15 rounded-full blur-[130px] pointer-events-none z-0 animate-breathe"></div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="animate-fade-in-up text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-[1.1] text-white">
            Hire expert professionals <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#868686]">
              and shop quality goods.
            </span>
          </h1>

          <p
            className="animate-fade-in-up text-lg text-gray-400 mb-10 max-w-2xl font-medium"
            style={{ animationDelay: "200ms" }}
          >
            The all-in-one marketplace for your home and business. Book trusted
            local tradesmen or buy premium materials directly.
          </p>

          <form
            onSubmit={submitSearch}
            className="animate-fade-in-up w-full max-w-3xl flex items-center bg-white rounded-xl overflow-hidden h-16 shadow-2xl shadow-black/50 border border-white/10 focus-within:ring-4 focus-within:ring-[#5B48FC]/30 focus-within:-translate-y-1 transition-all duration-300"
            style={{ animationDelay: "400ms" }}
          >
            <div className="pl-5 pr-3 text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for plumbers, furniture, paint, electricians..."
              className="w-full h-full text-lg outline-none bg-transparent placeholder:text-gray-400 text-[#131313] font-medium"
            />
            <div className="pr-2 py-2 h-full">
              <button
                type="submit"
                className="bg-[#5B48FC] hover:bg-[#4a3ae6] active:scale-95 text-white px-8 h-full rounded-lg font-bold transition-all shadow-sm"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 2. Sub Navigation */}
      <div className="border-b border-gray-200 bg-white sticky top-16 z-30 shadow-sm/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide py-4 gap-8 text-sm font-medium text-gray-500">
            {categories.length === 0
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-5 w-28 rounded bg-gray-100 animate-pulse"
                  />
                ))
              : categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="group whitespace-nowrap flex items-center gap-2 hover:text-[#5B48FC] transition-colors"
                  >
                    <span className="group-hover:rotate-6 group-hover:scale-110 transition-transform">
                      {CATEGORY_ICONS[cat.slug] ?? (
                        <Wrench className="w-5 h-5" />
                      )}
                    </span>
                    {cat.name}
                  </Link>
                ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-16 space-y-24">
        {/* 3. PROFESSIONALS SECTION */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#131313] tracking-tight">
                Top-Rated Professionals
              </h2>
              <p className="text-gray-500 mt-1">
                Hire verified tradesmen for your next project.
              </p>
            </div>
            <Link
              href="/handieman"
              className="hidden sm:flex items-center text-[#5B48FC] font-medium hover:underline group"
            >
              Browse all Pros{" "}
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : sellers.length === 0 ? (
            <p className="text-gray-500">
              No professionals have joined yet.{" "}
              <Link href="/auth/signup" className="text-[#5B48FC] font-medium hover:underline">
                Become a seller
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sellers.map((seller) => (
                <Link
                  key={seller.id}
                  href={`/seller/${seller.id}`}
                  className="group flex flex-col bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center mb-4 pt-2">
                    <div className="relative mb-3">
                      {seller.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={seller.avatarUrl}
                          alt={sellerName(seller)}
                          className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 group-hover:border-[#EFEDFF] transition-colors"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#EFEDFF] text-[#5B48FC] flex items-center justify-center text-2xl font-extrabold border-4 border-gray-50 group-hover:border-[#EFEDFF] transition-colors">
                          {sellerName(seller).charAt(0).toUpperCase()}
                        </div>
                      )}
                      {seller.isVerified && (
                        <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
                          <ShieldCheck className="w-5 h-5 text-[#5B48FC]" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {sellerName(seller)}
                    </span>
                    <span className="text-xs font-medium text-[#5B48FC] mt-0.5">
                      {seller.professions[0] ?? "Professional"}
                    </span>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold text-[#131313]">
                        {seller.stats.averageRating != null
                          ? seller.stats.averageRating.toFixed(1)
                          : "New"}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({seller.stats.reviewCount})
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#5B48FC] bg-[#EFEDFF] px-4 py-2 rounded-lg group-hover:bg-[#5B48FC] group-hover:text-white transition-colors">
                      View Profile
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 3b. SERVICES SECTION */}
        {services.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#131313] tracking-tight">
                  Popular Services
                </h2>
                <p className="text-gray-500 mt-1">
                  Book a service from top-rated professionals.
                </p>
              </div>
              <Link
                href="/products?kind=SERVICE"
                className="hidden sm:flex items-center text-[#5B48FC] font-medium hover:underline group"
              >
                Browse all services{" "}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/product/${service.slug}`}
                  className="group flex flex-col bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
                >
                  <h3 className="text-base font-medium text-[#131313] line-clamp-2 mb-3 group-hover:text-[#5B48FC] transition-colors">
                    {service.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-[#131313]">
                      {service.ratingAvg > 0 ? service.ratingAvg.toFixed(1) : "New"}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({service.reviewCount})
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 mb-4">
                    {[service.seller.firstName, service.seller.lastName]
                      .filter(Boolean)
                      .join(" ") || "Seller"}
                  </span>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-[#131313]">
                      {formatPrice(service.priceMinor, service.currency)}
                    </span>
                    <span className="text-sm font-bold text-[#5B48FC] bg-[#EFEDFF] px-4 py-2 rounded-lg group-hover:bg-[#5B48FC] group-hover:text-white transition-colors">
                      Book
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. PRODUCTS SECTION */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#131313] tracking-tight">
                Premium Materials &amp; Goods
              </h2>
              <p className="text-gray-500 mt-1">
                Shop high-quality tools, furniture, and supplies.
              </p>
            </div>
            <Link
              href="/products"
              className="hidden sm:flex items-center text-[#5B48FC] font-medium hover:underline group"
            >
              Browse all Products{" "}
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : products.length === 0 ? (
            <p className="text-gray-500">
              No products listed yet.{" "}
              <Link href="/seller/onboarding" className="text-[#5B48FC] font-medium hover:underline">
                List the first one
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        No image
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0F172A] text-xs font-bold px-2.5 py-1.5 rounded-md shadow-sm">
                      {product.seller.firstName
                        ? `${product.seller.firstName} ${
                            product.seller.lastName ?? ""
                          }`.trim()
                        : "Seller"}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-base font-medium text-[#131313] line-clamp-2 mb-2 group-hover:text-[#5B48FC] transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-4">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-[#131313]">
                        {product.ratingAvg > 0 ? product.ratingAvg.toFixed(1) : "New"}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({product.reviewCount})
                      </span>
                    </div>
                    <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                      <span className="text-lg font-extrabold text-[#131313]">
                        {formatPrice(product.priceMinor, product.currency)}
                      </span>
                      <span className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#5B48FC] group-hover:text-white transition-colors">
                        <ShoppingCart className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 5. Value Proposition (Trust Section) */}
      <section className="max-w-7xl mx-auto bg-gray-50 rounded-3xl p-8 md:p-16 border border-gray-200 hover:shadow-lg transition-shadow duration-500">
        <h2 className="text-3xl font-bold text-[#131313] mb-10 tracking-tight">
          A network of tools, talent, and trust.
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              title: "Verified Tradesmen",
              desc: "Every professional undergoes identity and skill verification before offering services.",
            },
            {
              title: "Secure Transactions",
              desc: "Your payment is held safely until the product is delivered or the job is done right.",
            },
            {
              title: "Real Client Reviews",
              desc: "Read honest feedback from past clients to ensure you hire the best person for the job.",
            },
          ].map((feature) => (
            <div key={feature.title} className="group cursor-default">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#EFEDFF] text-[#5B48FC] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#5B48FC] group-hover:text-white transition-all duration-300">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#131313]">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Bottom Call to Action */}
      <section className="relative max-w-7xl mx-auto mt-16 bg-[#5B48FC] rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 text-white overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to get the job done?
          </h2>
          <p className="text-lg text-[#EFEDFF]">
            Join thousands of customers and craftsmen relying on HandieHub every
            day.
          </p>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-shrink-0">
          <Link
            href="/handieman"
            className="bg-white text-[#5B48FC] py-3 px-8 rounded-lg font-bold text-center hover:bg-gray-50 active:scale-95 transition-all shadow-lg hover:shadow-xl"
          >
            Hire a Pro
          </Link>
          <Link
            href="/auth/signup"
            className="border border-white text-white py-3 px-8 rounded-lg font-bold text-center hover:bg-white/10 active:scale-95 transition-all"
          >
            Start Earning
          </Link>
        </div>
      </section>
    </div>
  );
}
