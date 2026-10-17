// "use client";

// import Link from "next/link";
// import { useEffect, useState } from "react";
// import {
//   User,
//   Star,
//   MapPin,
//   Clock,
//   ShieldCheck,
//   ChevronRight,
//   Image as ImageIcon,
//   Building2,
// } from "lucide-react";

// const formatMoney = (amount: number) => {
//   return new Intl.NumberFormat("en-NG", {
//     style: "currency",
//     currency: "NGN",
//     minimumFractionDigits: 0,
//   }).format(amount);
// };

// const MOCK_SELLER = {
//   id: "seller_1",
//   name: "Ambience Furniture",
//   businessName: "Ambience Furniture Ltd",
//   email: "hello@ambience.com",
//   phone: "+234 801 234 5678",
//   address: "Victoria Island, Lagos, Nigeria",
//   rating: 4.9,
//   reviewCount: 128,
//   isVerified: true,
//   responseTime: "1 hour",
//   memberSince: "March 2023",
//   image:
//     "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
//   coverImage:
//     "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
//   description:
//     "Premium furniture maker specializing in modern and contemporary designs. We deliver quality craftsmanship across Nigeria.",
//   categories: ["Furniture", "Interior Design", "Carpentry"],
//   totalOrders: 456,
//   completedOrders: 432,
//   totalRevenue: 12500000,
// };

// export default function SellerPage() {
//   const [activeTab, setActiveTab] = useState("overview");

//   return (
//     <div className="min-h-screen bg-[#F3F3F3]">
//       <div className="max-w-6xl mx-auto px-4 py-8">
//         {/* Cover Image */}
//         <div className="relative h-64 rounded-2xl overflow-hidden mb-6 shadow-lg">
//           <img
//             src={MOCK_SELLER.coverImage}
//             alt="Seller Cover"
//             className="w-full h-full object-cover"
//           />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
//           <div className="absolute bottom-0 left-0 p-6">
//             <div className="flex items-center gap-3">
//               <img
//                 src={MOCK_SELLER.image}
//                 alt={MOCK_SELLER.name}
//                 className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
//               />
//               <div>
//                 <h1 className="text-2xl font-bold text-white">
//                   {MOCK_SELLER.name}
//                 </h1>
//                 <p className="text-sm text-white/90">
//                   {MOCK_SELLER.businessName}
//                 </p>
//               </div>
//             </div>
//             <div className="mt-3 flex items-center gap-4 text-white/90">
//               {MOCK_SELLER.isVerified && (
//                 <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
//                   <ShieldCheck className="w-3 h-3" />
//                   <span className="text-xs">Verified</span>
//                 </span>
//               )}
//               <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
//                 <Clock className="w-3 h-3" />
//                 <span className="text-xs">{MOCK_SELLER.responseTime}</span>
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//           {/* Left Column - Seller Info */}
//           <div className="lg:col-span-1 space-y-6">
//             <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
//               <div className="space-y-4">
//                 <div className="flex items-center gap-3">
//                   <MapPin className="w-4 h-4 text-[#5B48FC]" />
//                   <p className="text-sm text-[#131313]">
//                     {MOCK_SELLER.address}
//                   </p>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <User className="w-4 h-4 text-[#5B48FC]" />
//                   <p className="text-sm text-[#131313]">{MOCK_SELLER.email}</p>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <div className="flex items-center gap-1">
//                     <svg
//                       className="w-4 h-4 text-[#5B48FC]"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
//                       />
//                     </svg>
//                     <span className="text-xs text-[#868686]">WhatsApp</span>
//                   </div>
//                   <a
//                     href={`wa.me:${MOCK_SELLER.phone.replace(/\D/g, "")}`}
//                     className="text-sm text-[#131313] font-medium hover:text-[#5B48FC] transition-colors"
//                   >
//                     {MOCK_SELLER.phone}
//                   </a>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
//               <h3 className="font-semibold text-[#131313] mb-4">About</h3>
//               <p className="text-[#868686] text-sm leading-relaxed">
//                 {MOCK_SELLER.description}
//               </p>
//               <div className="mt-4 flex flex-wrap gap-2">
//                 {MOCK_SELLER.categories.map((cat) => (
//                   <span
//                     key={cat}
//                     className="px-3 py-1 rounded bg-[#EFEDFF] text-[#5B48FC] text-xs font-semibold"
//                   >
//                     {cat}
//                   </span>
//                 ))}
//               </div>
//             </div>

//             <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
//               <h3 className="font-semibold text-[#131313] mb-4">Stats</h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="p-3 rounded-xl bg-[#F3F3F3]">
//                   <p className="text-xs text-[#868686] uppercase font-medium">
//                     Total Orders
//                   </p>
//                   <p className="text-lg font-bold text-[#131313]">
//                     {MOCK_SELLER.totalOrders}
//                   </p>
//                 </div>
//                 <div className="p-3 rounded-xl bg-[#F3F3F3]">
//                   <p className="text-xs text-[#868686] uppercase font-medium">
//                     Completed
//                   </p>
//                   <p className="text-lg font-bold text-[#131313]">
//                     {MOCK_SELLER.completedOrders}
//                   </p>
//                 </div>
//                 <div className="p-3 rounded-xl bg-[#F3F3F3]">
//                   <p className="text-xs text-[#868686] uppercase font-medium">
//                     Rating
//                   </p>
//                   <p className="text-lg font-bold text-[#131313]">
//                     {MOCK_SELLER.rating}
//                   </p>
//                 </div>
//                 <div className="p-3 rounded-xl bg-[#F3F3F3]">
//                   <p className="text-xs text-[#868686] uppercase font-medium">
//                     Revenue
//                   </p>
//                   <p className="text-lg font-bold text-[#131313]">
//                     {formatMoney(MOCK_SELLER.totalRevenue)}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Tabs */}
//           <div className="lg:col-span-3 space-y-6">
//             <div className="flex items-center justify-between mb-4">
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => setActiveTab("overview")}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                     activeTab === "overview"
//                       ? "bg-[#5B48FC] text-white"
//                       : "text-[#868686] hover:text-[#5B48FC]"
//                   }`}
//                 >
//                   Overview
//                 </button>
//                 <button
//                   onClick={() => setActiveTab("products")}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                     activeTab === "products"
//                       ? "bg-[#5B48FC] text-white"
//                       : "text-[#868686] hover:text-[#5B48FC]"
//                   }`}
//                 >
//                   Products
//                 </button>
//                 <button
//                   onClick={() => setActiveTab("reviews")}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                     activeTab === "reviews"
//                       ? "bg-[#5B48FC] text-white"
//                       : "text-[#868686] hover:text-[#5B48FC]"
//                   }`}
//                 >
//                   Reviews ({MOCK_SELLER.reviewCount})
//                 </button>
//               </div>
//             </div>

//             {activeTab === "overview" && (
//               <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
//                 <h3 className="font-semibold text-[#131313] mb-4">
//                   About {MOCK_SELLER.name}
//                 </h3>
//                 <p className="text-[#868686] text-sm leading-relaxed mb-6">
//                   {MOCK_SELLER.description}
//                 </p>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="bg-[#F3F3F3] rounded-xl p-4">
//                     <p className="text-xs text-[#868686] uppercase font-medium">
//                       Response Time
//                     </p>
//                     <p className="text-lg font-bold text-[#131313]">
//                       {MOCK_SELLER.responseTime}
//                     </p>
//                   </div>
//                   <div className="bg-[#F3F3F3] rounded-xl p-4">
//                     <p className="text-xs text-[#868686] uppercase font-medium">
//                       Member Since
//                     </p>
//                     <p className="text-lg font-bold text-[#131313]">
//                       {MOCK_SELLER.memberSince}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="mt-6">
//                   <button className="w-full py-3 rounded-xl border border-[#5B48FC] text-[#5B48FC] font-semibold hover:bg-[#5B48FC] hover:text-white transition-colors">
//                     Message Seller
//                   </button>
//                 </div>
//               </div>
//             )}

//             {activeTab === "products" && (
//               <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] overflow-hidden">
//                 <div className="p-6 border-b border-[#F3F3F3]">
//                   <h3 className="font-semibold text-[#131313]">
//                     Products & Services
//                   </h3>
//                 </div>
//                 <div className="divide-y divide-[#F3F3F3]">
//                   {[1, 2, 3].map((i) => (
//                     <div
//                       key={i}
//                       className="p-6 flex items-center justify-between group hover:bg-[#F3F3F3] transition-colors"
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 rounded-lg bg-[#F3F3F3] flex items-center justify-center">
//                           <ImageIcon className="w-5 h-5 text-[#868686]" />
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-[#131313]">
//                             Product Item {i}
//                           </p>
//                           <p className="text-xs text-[#868686]">
//                             Furniture • ₦24,999
//                           </p>
//                         </div>
//                       </div>
//                       <ChevronRight className="w-4 h-4 text-[#E8E8E8]" />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {activeTab === "reviews" && (
//               <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
//                 <div className="flex items-center justify-between mb-6">
//                   <div>
//                     <h3 className="font-semibold text-[#131313]">
//                       Customer Reviews
//                     </h3>
//                     <p className="text-xs text-[#868686]">
//                       {MOCK_SELLER.reviewCount} reviews • {MOCK_SELLER.rating}{" "}
//                       average rating
//                     </p>
//                   </div>
//                   <div className="flex text-[#D79900] text-xl">
//                     {[1, 2, 3, 4, 5].map((star) => (
//                       <span key={star}>
//                         {star <= MOCK_SELLER.rating ? "★" : "☆"}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="space-y-4">
//                   {[1, 2, 3].map((i) => (
//                     <div key={i} className="flex gap-3">
//                       <div className="w-10 h-10 rounded-full bg-[#EFEDFF] flex items-center justify-center overflow-hidden flex-shrink-0">
//                         <img
//                           src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
//                           alt="Reviewer"
//                           className="w-full h-full object-cover"
//                         />
//                       </div>
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2 mb-1">
//                           <p className="text-sm font-medium text-[#131313]">
//                             Customer {i}
//                           </p>
//                           <div className="flex text-[#D79900] text-xs">
//                             {[1, 2, 3, 4, 5].map((s) => (
//                               <span key={s}>{s <= 5 ? "★" : "☆"}</span>
//                             ))}
//                           </div>
//                         </div>
//                         <p className="text-sm text-[#868686]">
//                           Great service! Would recommend to others.
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  User,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  Image as ImageIcon,
  Building2,
} from "lucide-react";

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const MOCK_SELLER = {
  id: "seller_1",
  name: "Ambience Furniture",
  businessName: "Ambience Furniture Ltd",
  email: "hello@ambience.com",
  phone: "+234 801 234 5678",
  address: "Victoria Island, Lagos, Nigeria",
  rating: 4.9,
  reviewCount: 128,
  isVerified: true,
  responseTime: "1 hour",
  memberSince: "March 2023",
  image:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
  coverImage:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
  description:
    "Premium furniture maker specializing in modern and contemporary designs. We deliver quality craftsmanship across Nigeria.",
  categories: ["Furniture", "Interior Design", "Carpentry"],
  totalOrders: 456,
  completedOrders: 432,
  totalRevenue: 12500000,
};

export default function SellerPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-24">
      {/* Subtle load animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `,
        }}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Cover Image */}
        <div className="animate-fade-in-up relative h-64 md:h-80 rounded-2xl md:rounded-3xl overflow-hidden mb-8 shadow-sm">
          <img
            src={MOCK_SELLER.coverImage}
            alt="Seller Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-black/20 to-transparent"></div>

          <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
            <div className="flex items-center gap-4">
              <img
                src={MOCK_SELLER.image}
                alt={MOCK_SELLER.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {MOCK_SELLER.name}
                </h1>
                <p className="text-sm md:text-base text-gray-200 font-medium">
                  {MOCK_SELLER.businessName}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              {MOCK_SELLER.isVerified && (
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-white text-xs font-bold tracking-wide shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  VERIFIED
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-white text-xs font-bold tracking-wide shadow-sm">
                <Clock className="w-4 h-4" />
                REPLIES IN {MOCK_SELLER.responseTime.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Seller Info */}
          <div className="lg:col-span-1 space-y-6">
            <div
              className="animate-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              style={{ animationDelay: "100ms" }}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#5B48FC] mt-0.5" />
                  <p className="text-sm font-medium text-[#0F172A]">
                    {MOCK_SELLER.address}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#5B48FC]" />
                  <p className="text-sm font-medium text-[#0F172A] break-all">
                    {MOCK_SELLER.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-5 h-5 text-[#5B48FC]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </div>
                  <a
                    href={`wa.me:${MOCK_SELLER.phone.replace(/\D/g, "")}`}
                    className="text-sm text-[#0F172A] font-bold hover:text-[#5B48FC] transition-colors"
                  >
                    {MOCK_SELLER.phone}
                  </a>
                </div>
              </div>
            </div>

            <div
              className="animate-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              style={{ animationDelay: "150ms" }}
            >
              <h3 className="font-bold text-[#0F172A] text-lg mb-3">About</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">
                {MOCK_SELLER.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {MOCK_SELLER.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1.5 rounded-lg bg-[#5B48FC]/10 border border-[#5B48FC]/20 text-[#5B48FC] text-xs font-bold"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="animate-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              style={{ animationDelay: "200ms" }}
            >
              <h3 className="font-bold text-[#0F172A] text-lg mb-4">Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Total Orders
                  </p>
                  <p className="text-lg font-extrabold text-[#0F172A]">
                    {MOCK_SELLER.totalOrders}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Completed
                  </p>
                  <p className="text-lg font-extrabold text-[#0F172A]">
                    {MOCK_SELLER.completedOrders}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Rating
                  </p>
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-extrabold text-[#0F172A]">
                      {MOCK_SELLER.rating}
                    </p>
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 -mt-0.5" />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                    Revenue
                  </p>
                  <p
                    className="text-sm font-extrabold text-[#0F172A] truncate"
                    title={formatMoney(MOCK_SELLER.totalRevenue)}
                  >
                    {formatMoney(MOCK_SELLER.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div
            className="lg:col-span-3 space-y-6 animate-fade-in-up"
            style={{ animationDelay: "250ms" }}
          >
            <div className="flex items-center gap-2 mb-6 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 inline-flex w-full overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "overview"
                    ? "bg-[#5B48FC] text-white shadow-md"
                    : "text-gray-500 hover:text-[#0F172A] hover:bg-gray-50"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "products"
                    ? "bg-[#5B48FC] text-white shadow-md"
                    : "text-gray-500 hover:text-[#0F172A] hover:bg-gray-50"
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "reviews"
                    ? "bg-[#5B48FC] text-white shadow-md"
                    : "text-gray-500 hover:text-[#0F172A] hover:bg-gray-50"
                }`}
              >
                Reviews ({MOCK_SELLER.reviewCount})
              </button>
            </div>

            {activeTab === "overview" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h3 className="font-bold text-[#0F172A] text-xl mb-4">
                  About {MOCK_SELLER.name}
                </h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-8 font-medium">
                  {MOCK_SELLER.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">
                      Average Response Time
                    </p>
                    <p className="text-xl font-extrabold text-[#0F172A]">
                      {MOCK_SELLER.responseTime}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">
                      Member Since
                    </p>
                    <p className="text-xl font-extrabold text-[#0F172A]">
                      {MOCK_SELLER.memberSince}
                    </p>
                  </div>
                </div>

                <div>
                  <button className="w-full py-4 rounded-xl border-2 border-[#5B48FC] text-[#5B48FC] font-bold text-lg hover:bg-[#5B48FC] hover:text-white transition-all duration-300 active:scale-[0.98]">
                    Message Seller
                  </button>
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-[#0F172A] text-lg">
                    Products & Services
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 sm:p-6 flex items-center justify-between group hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 group-hover:bg-white group-hover:border-[#5B48FC]/30 transition-colors">
                          <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-[#5B48FC] transition-colors" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-[#0F172A] group-hover:text-[#5B48FC] transition-colors">
                            Product Item {i}
                          </p>
                          <p className="text-sm font-medium text-gray-500 mt-0.5">
                            Furniture • ₦24,999
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#5B48FC] transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                      </div>
                    </div>
                  ))}
                </div>
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
                      {MOCK_SELLER.reviewCount} reviews • {MOCK_SELLER.rating}{" "}
                      average rating
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                    <span className="font-extrabold text-xl text-[#0F172A] mr-2">
                      {MOCK_SELLER.rating}
                    </span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.floor(MOCK_SELLER.rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                        <img
                          src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80&random=${i}`}
                          alt="Reviewer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <p className="text-base font-bold text-[#0F172A]">
                            Customer {i}
                          </p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= 5 ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-600 leading-relaxed">
                          "Great service! The craftsmanship is exactly what we
                          were looking for. Highly recommend them to anyone
                          needing quality work done."
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
