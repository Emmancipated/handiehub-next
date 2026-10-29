"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Package,
  User,
} from "lucide-react";

type ListingRow = {
  id: string;
  slug: string;
  title: string;
  kind: "PRODUCT" | "SERVICE";
  priceMinor: string;
  currency: string;
  images: string[];
  category: { id: string; name: string; slug: string } | null;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { id: string; firstName: string | null; lastName: string | null };
};

type SellerProfilePayload = {
  businessName?: string | null;
  description?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  professions?: string[] | null;
  skills?: string[] | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  address?: string | null;
  responseTime?: string | null;
  responseTimeLabel?: string | null;
  intraStateDelivery?: {
    minMinutes: number;
    maxMinutes: number;
    label: string | null;
  } | null;
  interStateDelivery?: {
    minMinutes: number;
    maxMinutes: number;
    label: string | null;
  } | null;
  isVerified?: boolean;
};

type SellerPayload = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  memberSince: string;
  profile: SellerProfilePayload | null;
  listings: ListingRow[];
  stats: {
    listingCount: number;
    reviewCount: number;
    averageRating: number | null;
  };
};

const formatMoney = (minor: string, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(minor) / 100);

const fullName = (first: string | null, last: string | null) =>
  [first, last].filter(Boolean).join(" ").trim();

export default function SellerPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [seller, setSeller] = useState<SellerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    fetch(`/api/sellers/${id}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Seller not found");
        return body.seller as SellerPayload;
      })
      .then((data) => {
        setSeller(data);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err.message);
        setSeller(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!id || activeTab !== "reviews" || reviews.length > 0) return;
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReviewsLoading(true);

    fetch(`/api/reviews?sellerId=${id}&limit=20`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        setReviews(data?.reviews ?? []);
      })
      .catch(() => {
        /* reviews are optional for the storefront */
      })
      .finally(() => {
        if (!controller.signal.aborted) setReviewsLoading(false);
      });

    return () => controller.abort();
  }, [id, activeTab, reviews.length]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#5B48FC]" />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-extrabold text-[#0F172A] mb-2">
          Seller not found
        </h1>
        <p className="text-gray-500 mb-6">
          {error ?? "This storefront may have been removed."}
        </p>
        <Link
          href="/handieman"
          className="px-6 py-3 rounded-xl bg-[#5B48FC] text-white font-bold hover:bg-[#4A38E0] transition-colors"
        >
          Browse professionals
        </Link>
      </div>
    );
  }

  const profile = seller.profile ?? {};
  const displayName =
    profile.businessName ||
    fullName(seller.firstName, seller.lastName) ||
    "HandieHub Seller";
  const location =
    [profile.city, profile.state, profile.country].filter(Boolean).join(", ") ||
    profile.address ||
    "Location not provided";
  const memberSince = new Date(seller.memberSince).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
  const professions = profile.professions?.filter(Boolean) ?? [];
  const skills = profile.skills?.filter(Boolean) ?? [];
  const rating = seller.stats.averageRating;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Cover */}
        <div className="relative h-56 md:h-72 rounded-2xl md:rounded-3xl overflow-hidden mb-8 shadow-sm bg-gradient-to-br from-[#0F172A] via-[#2A2357] to-[#5B48FC]">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-black/10 to-transparent" />

          <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
            <div className="flex items-center gap-4">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg bg-[#EFEDFF] text-[#5B48FC] flex items-center justify-center text-3xl font-extrabold">
                  {initial}
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {displayName}
                </h1>
                {profile.businessName &&
                  fullName(seller.firstName, seller.lastName) && (
                    <p className="text-sm md:text-base text-gray-200 font-medium">
                      {fullName(seller.firstName, seller.lastName)}
                    </p>
                  )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {profile.isVerified && (
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-white text-xs font-bold tracking-wide shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  VERIFIED
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-white text-xs font-bold tracking-wide shadow-sm">
                <Clock className="w-4 h-4" />
                REPLIES{" "}
                {(profile.responseTimeLabel || "Within 24 hours").toUpperCase()}
              </span>
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-white text-xs font-bold tracking-wide shadow-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {rating != null ? rating.toFixed(1) : "NEW"} (
                {seller.stats.reviewCount})
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Seller Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#5B48FC] mt-0.5" />
                  <p className="text-sm font-medium text-[#0F172A]">
                    {location}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#5B48FC]" />
                  <p className="text-sm font-medium text-[#0F172A] break-all">
                    {profile.phoneNumber || "Contact via HandieHub"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-[#5B48FC]" />
                  <p className="text-sm font-medium text-[#0F172A]">
                    {seller.stats.listingCount} active listing
                    {seller.stats.listingCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-[#0F172A] text-lg mb-3">About</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">
                {profile.description ||
                  "This seller has not written a description yet."}
              </p>
              {(professions.length > 0 || skills.length > 0) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {[...professions, ...skills].slice(0, 8).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-lg bg-[#5B48FC]/10 border border-[#5B48FC]/20 text-[#5B48FC] text-xs font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-[#0F172A] text-lg mb-4">Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Listings
                  </p>
                  <p className="text-lg font-extrabold text-[#0F172A]">
                    {seller.stats.listingCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Reviews
                  </p>
                  <p className="text-lg font-extrabold text-[#0F172A]">
                    {seller.stats.reviewCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Rating
                  </p>
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-extrabold text-[#0F172A]">
                      {rating != null ? rating.toFixed(1) : "New"}
                    </p>
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 -mt-0.5" />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Member Since
                  </p>
                  <p className="text-sm font-extrabold text-[#0F172A] truncate">
                    {memberSince}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-2 mb-6 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 inline-flex w-full overflow-x-auto scrollbar-hide">
              {[
                { id: "overview", label: "Overview" },
                { id: "products", label: "Products & Services" },
                { id: "reviews", label: `Reviews (${seller.stats.reviewCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-[#5B48FC] text-white shadow-md"
                      : "text-gray-500 hover:text-[#0F172A] hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h3 className="font-bold text-[#0F172A] text-xl mb-4">
                  About {displayName}
                </h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-8 font-medium">
                  {profile.description ||
                    "This seller has not written a description yet."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">
                      Average Response Time
                    </p>
                    <p className="text-xl font-extrabold text-[#0F172A]">
                      {profile.responseTimeLabel || "Within 24 hours"}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">
                      Member Since
                    </p>
                    <p className="text-xl font-extrabold text-[#0F172A]">
                      {memberSince}
                    </p>
                  </div>
                  {profile.intraStateDelivery?.label && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">
                        Within your state
                      </p>
                      <p className="text-xl font-extrabold text-[#0F172A]">
                        {profile.intraStateDelivery.label}
                      </p>
                    </div>
                  )}
                  {profile.interStateDelivery?.label && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">
                        To other states
                      </p>
                      <p className="text-xl font-extrabold text-[#0F172A]">
                        {profile.interStateDelivery.label}
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  href={`/messages/${seller.id}`}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-[#5B48FC] text-[#5B48FC] font-bold text-lg hover:bg-[#5B48FC] hover:text-white transition-all duration-300 active:scale-[0.98]"
                >
                  <MessageSquare className="w-5 h-5" />
                  Message Seller
                </Link>
              </div>
            )}

            {activeTab === "products" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-[#0F172A] text-lg">
                    Products &amp; Services
                  </h3>
                </div>
                {seller.listings.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">
                    <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    This seller has no active listings yet.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {seller.listings.map((listing) => (
                      <Link
                        key={listing.id}
                        href={`/product/${listing.slug}`}
                        className="p-4 sm:p-6 flex items-center justify-between group hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0 group-hover:border-[#5B48FC]/30 transition-colors">
                            {listing.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-[#5B48FC] transition-colors" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-bold text-[#0F172A] group-hover:text-[#5B48FC] transition-colors truncate">
                              {listing.title}
                            </p>
                            <p className="text-sm font-medium text-gray-500 mt-0.5">
                              {listing.category?.name ?? listing.kind} •{" "}
                              {formatMoney(
                                listing.priceMinor,
                                listing.currency,
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#5B48FC] transition-colors flex-shrink-0">
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-xl mb-1">
                      Customer Reviews
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {seller.stats.reviewCount} review
                      {seller.stats.reviewCount === 1 ? "" : "s"}
                      {rating != null ? ` • ${rating.toFixed(1)} average rating` : ""}
                    </p>
                  </div>
                  {rating != null && (
                    <div className="flex items-center gap-1 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                      <span className="font-extrabold text-xl text-[#0F172A] mr-2">
                        {rating.toFixed(1)}
                      </span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.floor(rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-10 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading reviews…
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">
                    No reviews yet. Completed orders can leave a review.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex gap-4 p-4 rounded-2xl border border-transparent hover:bg-gray-50 hover:border-gray-100 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#EFEDFF] text-[#5B48FC] flex items-center justify-center overflow-hidden flex-shrink-0 font-extrabold">
                          {fullName(
                            review.author.firstName,
                            review.author.lastName,
                          ).charAt(0) || "C"}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <p className="text-base font-bold text-[#0F172A]">
                              {fullName(
                                review.author.firstName,
                                review.author.lastName,
                              ) || "Customer"}
                            </p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-gray-200 text-gray-200"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gray-400 ml-2">
                                {new Date(review.createdAt).toLocaleDateString(
                                  "en-NG",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-600 leading-relaxed">
                            {review.comment || "No comment provided."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
