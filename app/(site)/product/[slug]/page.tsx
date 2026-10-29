"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Star,
  MessageSquare,
  CalendarCheck,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import { addToCart } from "@/lib/cart/storage";

type Listing = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceMinor: string;
  currency: string;
  kind: "PRODUCT" | "SERVICE";
  status: string;
  stockOnHand: number | null;
  serviceDurationMins: number | null;
  serviceArea: string | null;
  images: string[];
  attributes: Record<string, unknown> | null;
  category: { id: string; name: string; slug: string };
  seller: { id: string; firstName: string | null; lastName: string | null };
  ratingAvg: number;
  reviewCount: number;
};

type SellerProfile = {
  businessName: string | null;
  avatarUrl: string | null;
  responseTime: string | null;
  responseTimeLabel: string | null;
  isVerified: boolean;
  city: string | null;
  state: string | null;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { id: string; firstName: string | null; lastName: string | null };
};

const formatPrice = (minor: string | number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(minor) / 100);

const displayName = (first: string | null, last: string | null) =>
  [first, last].filter(Boolean).join(" ") || "HandieHub seller";

function Stars({ rating, className = "w-4 h-4" }: { rating: number; className?: string }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`${className} ${
            value <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-100 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function stringifyAttribute(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [related, setRelated] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedBusy, setSavedBusy] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [serviceDate, setServiceDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setNotFound(false);
    setError(null);

    fetch(`/api/listings/${encodeURIComponent(slug)}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load listing");
        return data.listing as Listing;
      })
      .then((data) => {
        if (data) {
          setListing(data);
          setSelectedImage(0);
          setQuantity(1);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (!listing) return;
    const controller = new AbortController();

    fetch(`/api/sellers/${listing.seller.id}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.seller?.profile) setSellerProfile(data.seller.profile);
      })
      .catch(() => {});

    fetch(`/api/listings/${listing.id}/related?limit=4`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRelated(data?.related ?? []))
      .catch(() => {});

    fetch(`/api/reviews?listingId=${listing.id}&limit=6`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setReviews(data?.reviews ?? []))
      .catch(() => {});

    return () => controller.abort();
  }, [listing]);

  const isProduct = listing?.kind === "PRODUCT";

  // Hydrate the wishlist heart from the server. Anonymous visitors simply get
  // a 401 and keep the unsaved state.
  useEffect(() => {
    if (!listing) return;
    const controller = new AbortController();
    fetch("/api/saved", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.saved) {
          setIsSaved(
            data.saved.some(
              (row: { listing: { id: string } }) => row.listing.id === listing.id,
            ),
          );
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [listing]);

  const toggleSaved = async () => {
    if (!listing || savedBusy) return;
    const next = !isSaved;
    setSavedBusy(true);
    setIsSaved(next);

    try {
      const res = await fetch("/api/saved", {
        method: next ? "POST" : "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });

      if (res.status === 401) {
        setIsSaved(!next);
        router.push(`/auth/login?next=/product/${listing.slug}`);
        return;
      }
      if (!res.ok) throw new Error("Could not update your saved items.");
    } catch {
      setIsSaved(!next);
    } finally {
      setSavedBusy(false);
    }
  };

  const handleBuyOrBook = async () => {
    if (!listing) return;
    if (!isProduct && !serviceDate) {
      alert("Choose a preferred date and time for this service.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          items: [
            {
              listingId: listing.id,
              quantity,
            },
          ],
          ...(isProduct
            ? {}
            : { serviceSchedule: new Date(serviceDate).toISOString() }),
        }),
      });

      if (res.status === 401) {
        router.push(
          `/auth/login?next=${encodeURIComponent(`/product/${listing.slug}`)}`,
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "Could not create the order");
        return;
      }

      router.push(`/checkout/payment?orderId=${data.order.id}`);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddToCart = () => {
    if (!listing) return;
    const { replaced } = addToCart(
      {
        listingId: listing.id,
        slug: listing.slug,
        title: listing.title,
        priceMinor: Number(listing.priceMinor),
        currency: listing.currency,
        image: listing.images?.[0],
        sellerId: listing.seller.id,
        sellerName: displayName(
          listing.seller.firstName,
          listing.seller.lastName,
        ),
      },
      quantity,
    );
    setCartAdded(true);
    if (replaced) {
      window.alert(
        "Your cart can only hold items from one seller, so we replaced it with this item.",
      );
    }
    setTimeout(() => setCartAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        Loading listing…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold text-[#0F172A] mb-2">
          Listing not found
        </h1>
        <p className="text-gray-500 mb-6">
          This listing may have been removed or is no longer available.
        </p>
        <Link
          href="/products"
          className="px-6 py-3 rounded-xl bg-[#5B48FC] text-white font-bold hover:bg-[#4A38E0] transition-colors"
        >
          Browse listings
        </Link>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold text-[#0F172A] mb-2">
          Could not load this listing
        </h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="px-6 py-3 rounded-xl bg-[#5B48FC] text-white font-bold hover:bg-[#4A38E0] transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const images = listing.images.length
    ? listing.images
    : ["https://placehold.co/1000x800?text=No+image"];
  const seller = sellerProfile;
  const location = [seller?.city, seller?.state].filter(Boolean).join(", ");
  const attributes = listing.attributes
    ? Object.entries(listing.attributes)
    : [];

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

      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#0F172A] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500">
            <Link href="/" className="hover:text-[#5B48FC]">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              href={`/category/${listing.category.slug}`}
              className="hover:text-[#5B48FC]"
            >
              {listing.category.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#0F172A] truncate max-w-[200px]">
              {listing.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void toggleSaved()}
              disabled={savedBusy}
              aria-label={isSaved ? "Remove from saved" : "Save listing"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSaved ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-[#0F172A]"}`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? "fill-red-500" : ""}`} />
            </button>
            <button
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.share) {
                  navigator
                    .share({ title: listing.title, url: window.location.href })
                    .catch(() => {});
                } else if (typeof navigator !== "undefined") {
                  navigator.clipboard?.writeText(window.location.href).catch(() => {});
                }
              }}
              aria-label="Share listing"
              className="w-10 h-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 hover:text-[#0F172A] transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="relative h-[400px] rounded-2xl overflow-hidden bg-[#F3F3F3] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[selectedImage] ?? images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0F172A] text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg shadow-sm">
                {isProduct ? "Product" : "Service"}
              </span>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImage === index
                        ? "border-[#5B48FC]"
                        : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`${listing.title} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] leading-tight mb-3">
                {listing.title}
              </h1>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-[#0F172A] text-sm">
                    {listing.ratingAvg > 0 ? listing.ratingAvg.toFixed(1) : "New"}
                  </span>
                </div>
                <a
                  href="#reviews"
                  className="text-sm font-medium text-gray-500 underline decoration-gray-300 underline-offset-4 hover:text-[#5B48FC]"
                >
                  {listing.reviewCount}{" "}
                  {listing.reviewCount === 1 ? "Review" : "Reviews"}
                </a>
              </div>
              <div className="text-4xl font-extrabold text-[#0F172A]">
                {formatPrice(listing.priceMinor, listing.currency)}
                {!isProduct && listing.serviceDurationMins && (
                  <span className="text-lg font-medium text-gray-400 ml-1">
                    / {listing.serviceDurationMins} mins
                  </span>
                )}
              </div>
            </div>

            <div
              onClick={() => router.push(`/seller/${listing.seller.id}`)}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-[#5B48FC]/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                {seller?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={seller.avatarUrl}
                    alt={displayName(listing.seller.firstName, listing.seller.lastName)}
                    className="w-14 h-14 rounded-full object-cover border border-gray-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#EFEDFF] text-[#5B48FC] flex items-center justify-center font-extrabold">
                    {(listing.seller.firstName?.[0] ?? "S").toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-[#0F172A] group-hover:text-[#5B48FC] transition-colors flex items-center gap-1.5">
                    {seller?.businessName ||
                      displayName(listing.seller.firstName, listing.seller.lastName)}
                    {seller?.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                    )}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {seller?.responseTimeLabel || seller?.responseTime
                      ? `Replies ${
                          seller.responseTimeLabel ?? seller.responseTime
                        }`
                      : location || "View seller profile"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#5B48FC] transition-colors" />
            </div>

            <div className="space-y-6 py-6 border-y border-gray-100">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-[#0F172A]">
                  {isProduct ? "Quantity" : "Sessions"}
                </label>
                <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 w-max">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-extrabold text-[#0F172A] text-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {isProduct && listing.stockOnHand !== null && (
                  <p className="text-xs font-medium text-gray-500">
                    {listing.stockOnHand > 0
                      ? `${listing.stockOnHand} in stock`
                      : "Out of stock"}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setCheckingAvailability(true);
                  setTimeout(() => {
                    setCheckingAvailability(false);
                    alert(
                      isProduct
                        ? listing.stockOnHand && listing.stockOnHand > 0
                          ? "Item is in stock and ready for delivery."
                          : "This item is currently out of stock."
                        : "The professional is available for booking this week.",
                    );
                  }, 900);
                }}
                disabled={checkingAvailability}
                className="w-full py-4 rounded-xl border-2 border-gray-100 bg-white text-[#0F172A] font-bold flex items-center justify-center gap-2 hover:border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-60"
              >
                {checkingAvailability ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#10B981]" /> Check
                    Availability
                  </>
                )}
              </button>

              {!isProduct && (
                <label className="block rounded-2xl border border-gray-200 bg-white p-4">
                  <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                    <CalendarCheck className="h-4 w-4 text-[#5B48FC]" />
                    Preferred date and time
                  </span>
                  <input
                    type="datetime-local"
                    value={serviceDate}
                    onChange={(event) => setServiceDate(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-medium focus:border-[#5B48FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/40"
                  />
                  <span className="mt-1.5 block text-xs font-medium text-gray-500">
                    The professional will confirm or suggest another slot.
                  </span>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                {isProduct ? (
                  <>
                    <button
                      id="addToCartBtn"
                      onClick={handleAddToCart}
                      className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-bold transition-all active:scale-95 ${
                        cartAdded
                          ? "border-[#10B981] bg-[#10B981] text-white"
                          : "border-[#5B48FC] text-[#5B48FC] hover:bg-[#EFEDFF]"
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {cartAdded ? "Added" : "Add to Cart"}
                    </button>
                    <button
                      onClick={handleBuyOrBook}
                      disabled={busy}
                      className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#5B48FC] text-white font-bold shadow-md hover:bg-[#4A38E0] hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Buy Now"
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        router.push(`/messages/${listing.seller.id}`)
                      }
                      className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-[#5B48FC] text-[#5B48FC] font-bold hover:bg-[#EFEDFF] transition-all active:scale-95"
                    >
                      <MessageSquare className="w-5 h-5" /> Message
                    </button>
                    <button
                      onClick={handleBuyOrBook}
                      disabled={busy}
                      className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#5B48FC] text-white font-bold shadow-md hover:bg-[#4A38E0] hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CalendarCheck className="w-5 h-5" /> Book Now
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">
                  HandieHub Protection
                </h4>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Your payment is held securely until the{" "}
                  {isProduct ? "item is delivered" : "job is completed"} to your
                  satisfaction.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
              <Info className="w-6 h-6 text-[#5B48FC]" /> Overview
            </h2>
            <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#0F172A] mb-5">
                {isProduct ? "Specifications" : "Service Details"}
              </h3>
              <div className="space-y-4">
                {attributes.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                      {key}
                    </span>
                    <span className="text-sm font-bold text-[#0F172A] text-right ml-4">
                      {stringifyAttribute(value)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                    Category
                  </span>
                  <Link
                    href={`/category/${listing.category.slug}`}
                    className="text-sm font-bold text-[#5B48FC] text-right ml-4 hover:underline"
                  >
                    {listing.category.name}
                  </Link>
                </div>
                {!isProduct && listing.serviceArea && (
                  <div className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                      Service area
                    </span>
                    <span className="text-sm font-bold text-[#0F172A] text-right ml-4">
                      {listing.serviceArea}
                    </span>
                  </div>
                )}
                {location && (
                  <div className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                      Location
                    </span>
                    <span className="text-sm font-bold text-[#0F172A] text-right ml-4">
                      {location}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <section id="reviews" className="mt-16 pt-10 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
              <Star className="w-6 h-6 text-[#5B48FC]" /> Reviews
            </h2>
            <div className="flex items-center gap-2">
              <Stars rating={listing.ratingAvg} />
              <span className="text-sm font-bold text-[#0F172A]">
                {listing.ratingAvg > 0 ? listing.ratingAvg.toFixed(1) : "New"}
              </span>
              <span className="text-sm text-gray-500">
                ({listing.reviewCount})
              </span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="text-gray-500 font-medium">
              No reviews yet. Reviews can be left after a completed order.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#0F172A]">
                      {displayName(
                        review.author.firstName,
                        review.author.lastName,
                      )}
                    </span>
                    <Stars rating={review.rating} className="w-3.5 h-3.5" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(review.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">
              You may also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.slug}`}
                  className="group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
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
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[#0F172A] leading-tight mb-2 group-hover:text-[#5B48FC] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-lg font-extrabold text-[#0F172A]">
                      {formatPrice(item.priceMinor, item.currency)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
