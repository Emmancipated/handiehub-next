// "use client";

// import Link from "next/link";
// import { useEffect, useState } from "react";
// import {
//   Users,
//   Star,
//   MapPin,
//   Clock,
//   ShieldCheck,
//   ChevronRight,
//   Image as ImageIcon,
//   Search,
// } from "lucide-react";

// const PRIMARY = "#5B48FC";

// const formatMoney = (amount: number) => {
//   return new Intl.NumberFormat("en-NG", {
//     style: "currency",
//     currency: "NGN",
//     minimumFractionDigits: 0,
//   }).format(amount);
// };

// const MOCK_HANDIEMEN = [
//   {
//     id: "handieman_1",
//     name: "Samuel Adebayo",
//     profession: "Plumber",
//     rating: 4.9,
//     reviewCount: 128,
//     price: 5000,
//     priceUnit: "per hour",
//     location: "Lagos, Nigeria",
//     isVerified: true,
//     isOnline: true,
//     responseTime: "1 hour",
//     image:
//       "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
//     services: ["Pipe Repair", "Leak Fix", "Installation", "Maintenance"],
//   },
//   {
//     id: "handieman_2",
//     name: "Grace Okafor",
//     profession: "Carpenter",
//     rating: 4.8,
//     reviewCount: 94,
//     price: 7500,
//     priceUnit: "per hour",
//     location: "Abuja, Nigeria",
//     isVerified: true,
//     isOnline: false,
//     responseTime: "2 hours",
//     image:
//       "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
//     services: ["Furniture", "Cabinets", "Repair", "Custom Work"],
//   },
//   {
//     id: "handieman_3",
//     name: "Michael Chukwu",
//     profession: "Electrician",
//     rating: 4.7,
//     reviewCount: 76,
//     price: 6000,
//     priceUnit: "per hour",
//     location: "Port Harcourt, Nigeria",
//     isVerified: true,
//     isOnline: true,
//     responseTime: "30 mins",
//     image:
//       "https://images.unsplash.com/photo-1519084509279-5b439a5b3125?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
//     services: ["Wiring", "Lighting", "Repair", "Installation"],
//   },
//   {
//     id: "handieman_4",
//     name: "Adaeze Nwosu",
//     profession: "Cleaner",
//     rating: 4.9,
//     reviewCount: 203,
//     price: 4000,
//     priceUnit: "per hour",
//     location: "Lagos, Nigeria",
//     isVerified: true,
//     isOnline: true,
//     responseTime: "15 mins",
//     image:
//       "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
//     services: ["Home Cleaning", "Office Cleaning", "Deep Clean", "Laundry"],
//   },
// ];

// export default function HandiemanPage() {
//   const [search, setSearch] = useState("");
//   const [filter, setFilter] = useState("all");

//   const filtered = MOCK_HANDIEMEN.filter(
//     (h) =>
//       h.name.toLowerCase().includes(search.toLowerCase()) ||
//       h.profession.toLowerCase().includes(search.toLowerCase()),
//   );

//   return (
//     <div className="min-h-screen bg-[#F3F3F3]">
//       <div className="max-w-6xl mx-auto px-4 py-8">
//         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-[#131313] mb-2">
//               Find a Handieman
//             </h1>
//             <p className="text-[#868686] text-sm">
//               Connect with skilled professionals near you
//             </p>
//           </div>
//           <div className="relative w-full lg:w-96">
//             <Search className="absolute left-3 top-3 w-4 h-4 text-[#868686]" />
//             <input
//               type="text"
//               placeholder="Search handiemen by name or profession..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#E8E8E8] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm"
//             />
//           </div>
//         </div>

//         {/* Filter Chips */}
//         <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
//           {[
//             { id: "all", label: "All" },
//             { id: "plumber", label: "Plumber" },
//             { id: "carpenter", label: "Carpenter" },
//             { id: "electrician", label: "Electrician" },
//             { id: "cleaner", label: "Cleaner" },
//           ].map((f) => (
//             <button
//               key={f.id}
//               onClick={() => setFilter(f.id)}
//               className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium border transition-all ${
//                 filter === f.id
//                   ? "bg-[#5B48FC] text-white border-[#5B48FC]"
//                   : "border-[#E8E8E8] text-[#868686] hover:bg-[#F3F3F3]"
//               }`}
//             >
//               {f.label}
//             </button>
//           ))}
//         </div>

//         {/* Handiemen Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filtered.map((handieman) => (
//             <Link
//               key={handieman.id}
//               href={`/seller/${handieman.id}`}
//               className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] overflow-hidden hover:shadow-lg transition-all group"
//             >
//               <div className="relative h-48">
//                 <img
//                   src={handieman.image}
//                   alt={handieman.name}
//                   className="w-full h-full object-cover"
//                 />
//                 <div className="absolute top-3 right-3 flex gap-2">
//                   {handieman.isVerified && (
//                     <span className="px-2 py-1 rounded bg-[#10B981]/90 text-white text-[10px] font-semibold flex items-center gap-1">
//                       <ShieldCheck className="w-3 h-3" /> Verified
//                     </span>
//                   )}
//                   {handieman.isOnline && (
//                     <span className="px-2 py-1 rounded bg-[#5B48FC] text-white text-[10px] font-semibold flex items-center gap-1">
//                       <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
//                       Online
//                     </span>
//                   )}
//                 </div>
//               </div>

//               <div className="p-5">
//                 <div className="flex items-center justify-between mb-2">
//                   <h3 className="text-lg font-bold text-[#131313]">
//                     {handieman.name}
//                   </h3>
//                   <div className="flex text-[#D79900] text-xs">
//                     {[1, 2, 3, 4, 5].map((star) => (
//                       <span key={star}>
//                         {star <= handieman.rating ? "★" : "☆"}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//                 <p className="text-sm text-[#868686] mb-1">
//                   {handieman.profession}
//                 </p>
//                 <p className="text-xs text-[#868686] mb-4">
//                   {handieman.location}
//                 </p>

//                 <div className="space-y-3 mb-4">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-[#868686]">Rate</span>
//                     <span className="text-[#131313] font-semibold">
//                       {formatMoney(handieman.price)} / {handieman.priceUnit}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-[#868686]">Response Time</span>
//                     <span className="text-[#131313] font-medium">
//                       {handieman.responseTime}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-[#868686]">Reviews</span>
//                     <span className="text-[#131313] font-medium">
//                       {handieman.reviewCount}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="flex gap-2 mb-4">
//                   {handieman.services.slice(0, 3).map((service) => (
//                     <span
//                       key={service}
//                       className="px-2 py-1 rounded bg-[#F3F3F3] text-[#868686] text-[10px] font-medium"
//                     >
//                       {service}
//                     </span>
//                   ))}
//                 </div>

//                 <div className="flex gap-3">
//                   <button className="flex-1 py-3 rounded-xl border border-[#5B48FC] text-[#5B48FC] font-semibold text-center hover:bg-[#5B48FC] hover:text-white transition-colors">
//                     Message
//                   </button>
//                   <button className="flex-1 py-3 rounded-xl bg-[#5B48FC] text-white font-semibold text-center hover:bg-[#4A38E0] transition-colors">
//                     Book Now
//                   </button>
//                 </div>
//               </div>
//             </Link>
//           ))}
//         </div>

//         {filtered.length === 0 && (
//           <div className="text-center py-20">
//             <div className="w-16 h-16 rounded-full bg-[#EFEDFF] flex items-center justify-center mx-auto mb-4 text-[#5B48FC] text-2xl">
//               <Users />
//             </div>
//             <h3 className="text-xl font-bold text-[#131313] mb-2">
//               No handiemen found
//             </h3>
//             <p className="text-[#868686] text-sm">
//               Try adjusting your search or filters
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// "use client";

// import Link from "next/link";
// import { useState } from "react";
// import {
//   Search,
//   Star,
//   ChevronDown,
//   ArrowRight,
//   ShieldCheck,
//   SlidersHorizontal,
//   Briefcase,
// } from "lucide-react";

// // --- Mock Data tailored for Services/Professionals ---
// const CATEGORY_FILTERS = [
//   "All Professionals",
//   "Plumbers",
//   "Electricians",
//   "Carpenters",
//   "Cleaners",
//   "Welders",
// ];

// const MOCK_SERVICES = [
//   {
//     id: "s1",
//     slug: "master-plumber",
//     title: "Master Plumber: Leak Repair & Piping",
//     price: 15000,
//     category: "Plumbers",
//     rating: 5.0,
//     reviews: 142,
//     proName: "FixIt Right Plumbers",
//     isVerified: true,
//     dp: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
//     coverImage:
//       "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80",
//   },
//   {
//     id: "s2",
//     slug: "custom-carpentry",
//     title: "Custom Cabinetry & Furniture Repair",
//     price: 25000,
//     category: "Carpenters",
//     rating: 4.8,
//     reviews: 89,
//     proName: "WoodWorks Pro",
//     isVerified: true,
//     dp: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
//     coverImage:
//       "https://images.unsplash.com/photo-1610505465598-a3f295325b39?w=600&q=80",
//   },
//   {
//     id: "s3",
//     slug: "electrical-wiring",
//     title: "Home Electrical Wiring & Lighting",
//     price: 20000,
//     category: "Electricians",
//     rating: 4.9,
//     reviews: 210,
//     proName: "Spark Electricals",
//     isVerified: true,
//     dp: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
//     coverImage:
//       "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80",
//   },
//   {
//     id: "s4",
//     slug: "deep-cleaning",
//     title: "Post-Construction Deep Cleaning",
//     price: 35000,
//     category: "Cleaners",
//     rating: 4.7,
//     reviews: 312,
//     proName: "Pristine Cleaners",
//     isVerified: true,
//     dp: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80",
//     coverImage:
//       "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&q=80",
//   },
//   {
//     id: "s5",
//     slug: "welding-fabrication",
//     title: "Iron Gates & Metal Fabrication",
//     price: 65000,
//     category: "Welders",
//     rating: 4.8,
//     reviews: 76,
//     proName: "SteelCraft Masters",
//     isVerified: true,
//     dp: "https://images.unsplash.com/photo-1504222490345-c075b6008014?w=200&q=80",
//     coverImage:
//       "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
//   },
//   {
//     id: "s6",
//     slug: "ac-repair",
//     title: "AC Installation & Maintenance",
//     price: 12000,
//     category: "Electricians",
//     rating: 4.6,
//     reviews: 94,
//     proName: "CoolBreeze Tech",
//     isVerified: false,
//     dp: "https://ui-avatars.com/api/?name=Cool+Breeze&background=F8FAFC&color=0F172A",
//     coverImage:
//       "https://images.unsplash.com/photo-1527689638836-411945a2b57c?w=600&q=80",
//   },
// ];

// export default function ServicesPage() {
//   const [search, setSearch] = useState("");
//   const [activeCategory, setActiveCategory] = useState("All Professionals");
//   const [sort, setSort] = useState("featured");

//   const formatPrice = (price: number) => {
//     return new Intl.NumberFormat("en-NG", {
//       style: "currency",
//       currency: "NGN",
//       minimumFractionDigits: 0,
//     }).format(price);
//   };

//   // Filter Logic
//   const filteredServices = MOCK_SERVICES.filter((s) => {
//     const matchesSearch =
//       s.title.toLowerCase().includes(search.toLowerCase()) ||
//       s.proName.toLowerCase().includes(search.toLowerCase());
//     const matchesCategory =
//       activeCategory === "All Professionals" || s.category === activeCategory;
//     return matchesSearch && matchesCategory;
//   });

//   return (
//     <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-24">
//       {/* Animation Styles (Identical to Products page for uniformity) */}
//       <style
//         dangerouslySetInnerHTML={{
//           __html: `
//         @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
//         .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
//       `,
//         }}
//       />

//       {/* 1. Page Header */}
//       <div className="bg-white border-b border-gray-200 pt-10 pb-8 px-4">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
//             <div className="animate-fade-in-up">
//               <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
//                 Hire Professionals
//               </h1>
//               <p className="text-gray-500 text-lg">
//                 Find trusted tradesmen and service providers for your next
//                 project.
//               </p>
//             </div>

//             {/* Search Bar */}
//             <div
//               className="animate-fade-in-up relative w-full md:w-80"
//               style={{ animationDelay: "100ms" }}
//             >
//               <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search services or names..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all text-sm font-medium shadow-sm"
//               />
//             </div>
//           </div>

//           {/* 2. Horizontal Filter Toolbar */}
//           <div
//             className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100"
//             style={{ animationDelay: "150ms" }}
//           >
//             {/* Category Pills */}
//             <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-grow">
//               {CATEGORY_FILTERS.map((cat) => (
//                 <button
//                   key={cat}
//                   onClick={() => setActiveCategory(cat)}
//                   className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
//                     activeCategory === cat
//                       ? "bg-[#0F172A] text-white shadow-md"
//                       : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#5B48FC] hover:text-[#5B48FC]"
//                   }`}
//                 >
//                   {cat}
//                 </button>
//               ))}
//             </div>

//             {/* Sort & Advanced Filters */}
//             <div className="flex items-center gap-3 flex-shrink-0">
//               <div className="relative group">
//                 <select
//                   value={sort}
//                   onChange={(e) => setSort(e.target.value)}
//                   className="pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#5B48FC] focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 text-sm font-medium text-[#0F172A] appearance-none cursor-pointer transition-all shadow-sm w-full sm:w-auto"
//                 >
//                   <option value="featured">Sort by: Featured</option>
//                   <option value="price-low">Price: Low to High</option>
//                   <option value="rating">Top Rated</option>
//                   <option value="reviews">Most Reviewed</option>
//                 </select>
//                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#5B48FC] transition-colors" />
//               </div>

//               <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#5B48FC] text-gray-600 hover:text-[#5B48FC] transition-all shadow-sm font-medium text-sm">
//                 <SlidersHorizontal className="w-4 h-4" />
//                 <span className="hidden sm:inline">Filters</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* 3. Services Grid */}
//       <div className="max-w-7xl mx-auto px-4 py-10">
//         {filteredServices.length === 0 ? (
//           <div className="text-center py-20">
//             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
//               <Search className="w-8 h-8" />
//             </div>
//             <h3 className="text-xl font-bold text-[#0F172A] mb-2">
//               No professionals found
//             </h3>
//             <p className="text-gray-500">
//               We couldn't find anyone matching your current filters.
//             </p>
//             <button
//               onClick={() => {
//                 setSearch("");
//                 setActiveCategory("All Professionals");
//               }}
//               className="mt-4 text-[#5B48FC] font-semibold hover:underline"
//             >
//               Clear all filters
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             {filteredServices.map((service, index) => (
//               <Link
//                 key={service.id}
//                 href={`/product/${service.slug}`}
//                 className="animate-fade-in-up group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
//                 style={{ animationDelay: `${200 + index * 50}ms` }}
//               >
//                 {/* Cover Image Container */}
//                 <div className="relative h-32 overflow-hidden bg-gray-100 border-b border-gray-100">
//                   <img
//                     src={service.coverImage}
//                     alt={service.title}
//                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
//                   />
//                   {/* Category Tag overlay */}
//                   <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0F172A] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md shadow-sm">
//                     {service.category}
//                   </span>
//                 </div>

//                 {/* Content Container (Avatar overlaps the cover image) */}
//                 <div className="p-5 flex flex-col flex-grow relative pt-8">
//                   {/* Floating Avatar Profile Picture */}
//                   <div className="absolute -top-8 left-5">
//                     <div className="relative">
//                       <img
//                         src={service.dp}
//                         alt={service.proName}
//                         className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-sm bg-white"
//                       />
//                       {service.isVerified && (
//                         <div className="absolute bottom-0 right-0 bg-white rounded-full p-[2px]">
//                           <ShieldCheck className="w-4 h-4 text-[#5B48FC]" />
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Pro Name */}
//                   <div className="flex items-center gap-1.5 mb-1.5 mt-2">
//                     <span className="text-sm font-semibold text-gray-500 truncate">
//                       {service.proName}
//                     </span>
//                   </div>

//                   {/* Title */}
//                   <h3 className="font-bold text-[#0F172A] text-lg leading-tight mb-3 group-hover:text-[#5B48FC] transition-colors line-clamp-2">
//                     {service.title}
//                   </h3>

//                   {/* Rating */}
//                   <div className="flex items-center gap-1.5 mb-4">
//                     <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
//                     <span className="text-sm font-bold text-[#0F172A]">
//                       {service.rating.toFixed(1)}
//                     </span>
//                     <span className="text-sm text-gray-500">
//                       ({service.reviews})
//                     </span>
//                   </div>

//                   {/* Footer: Price & Book Pro */}
//                   <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between">
//                     <div>
//                       <span className="text-xs text-gray-400 block mb-0.5 font-medium">
//                         Starting at
//                       </span>
//                       <span className="text-xl font-extrabold text-[#0F172A]">
//                         {formatPrice(service.price)}
//                       </span>
//                     </div>
//                     {/* Book Action Button */}
//                     <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-50 text-[#0F172A] font-bold text-sm group-hover:bg-[#5B48FC] group-hover:text-white transition-all duration-300">
//                       Book <ArrowRight className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         )}

//         {/* Load More */}
//         {filteredServices.length > 0 && (
//           <div
//             className="mt-12 flex justify-center animate-fade-in-up"
//             style={{ animationDelay: "600ms" }}
//           >
//             <button className="px-8 py-3 rounded-full border-2 border-gray-200 text-gray-700 font-bold hover:border-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-all duration-300">
//               Load More Professionals
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Users,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  ChevronDown,
  MessageSquare,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";

const CATEGORY_FILTERS = [
  "All Professionals",
  "Plumbers",
  "Carpenters",
  "Electricians",
  "Cleaners",
];

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const MOCK_HANDIEMEN = [
  {
    id: "handieman_1",
    name: "Samuel Adebayo",
    profession: "Plumber",
    rating: 4.9,
    reviewCount: 128,
    price: 5000,
    priceUnit: "per hour",
    location: "Lagos, Nigeria",
    isVerified: true,
    isOnline: true,
    responseTime: "1 hour",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    services: ["Pipe Repair", "Leak Fix", "Installation"],
  },
  {
    id: "handieman_2",
    name: "Grace Okafor",
    profession: "Carpenter",
    rating: 4.8,
    reviewCount: 94,
    price: 7500,
    priceUnit: "per hour",
    location: "Abuja, Nigeria",
    isVerified: true,
    isOnline: false,
    responseTime: "2 hours",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    services: ["Furniture", "Cabinets", "Custom Work"],
  },
  {
    id: "handieman_3",
    name: "Michael Chukwu",
    profession: "Electrician",
    rating: 4.7,
    reviewCount: 76,
    price: 6000,
    priceUnit: "per hour",
    location: "Port Harcourt, Nigeria",
    isVerified: true,
    isOnline: true,
    responseTime: "30 mins",
    image:
      "https://images.unsplash.com/photo-1519084509279-5b439a5b3125?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    services: ["Wiring", "Lighting", "Installation"],
  },
  {
    id: "handieman_4",
    name: "Adaeze Nwosu",
    profession: "Cleaner",
    rating: 4.9,
    reviewCount: 203,
    price: 4000,
    priceUnit: "per hour",
    location: "Lagos, Nigeria",
    isVerified: true,
    isOnline: true,
    responseTime: "15 mins",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    services: ["Deep Clean", "Office", "Laundry"],
  },
];

export default function HandiemanPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Professionals");
  const [sort, setSort] = useState("featured");

  // Filter Logic
  const filtered = MOCK_HANDIEMEN.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.profession.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All Professionals" ||
      h.profession + "s" === activeCategory; // basic plural matching for mock
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

      {/* 1. Page Header (Matches Products Page exactly) */}
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

            {/* Search Bar */}
            <div
              className="animate-fade-in-up relative w-full md:w-80"
              style={{ animationDelay: "100ms" }}
            >
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or profession..."
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
                  <option value="rating">Top Rated</option>
                  <option value="price-low">Rate: Low to High</option>
                  <option value="response">Fastest Response</option>
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

      {/* 3. Handiemen Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">
              No professionals found
            </h3>
            <p className="text-gray-500">
              We couldn't find anyone matching your current filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All Professionals");
              }}
              className="mt-4 text-[#5B48FC] font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((pro, index) => (
              <Link
                key={pro.id}
                href={`/seller/${pro.id}`}
                className="animate-fade-in-up group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300"
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                {/* Photo & Badges */}
                <div className="relative h-56 overflow-hidden bg-gray-100 border-b border-gray-100">
                  <img
                    src={pro.image}
                    alt={pro.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    {pro.isVerified && (
                      <span className="px-2.5 py-1.5 rounded-md bg-white/90 backdrop-blur-md text-[#0F172A] text-[10px] font-bold tracking-wide shadow-sm flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />{" "}
                        VERIFIED
                      </span>
                    )}
                    {pro.isOnline && (
                      <span className="px-2.5 py-1.5 rounded-md bg-[#0F172A]/80 backdrop-blur-md text-white text-[10px] font-bold tracking-wide shadow-sm flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></div>{" "}
                        ONLINE
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Content */}
                <div className="p-5 flex flex-col flex-grow">
                  {/* Title & Rating Row */}
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-[#0F172A] text-lg leading-tight group-hover:text-[#5B48FC] transition-colors">
                      {pro.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-[#0F172A]">
                        {pro.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Subtitle & Location */}
                  <p className="text-sm font-medium text-[#5B48FC] mb-2">
                    {pro.profession}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                    <MapPin className="w-3.5 h-3.5" /> {pro.location}
                    <span className="mx-1">•</span>
                    <Clock className="w-3.5 h-3.5" /> Replies in{" "}
                    {pro.responseTime}
                  </div>

                  {/* Service Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {pro.services.slice(0, 3).map((service) => (
                      <span
                        key={service}
                        className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-bold tracking-wide"
                      >
                        {service}
                      </span>
                    ))}
                  </div>

                  {/* Footer (Price & Actions) */}
                  <div className="pt-4 border-t border-gray-50 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 font-medium">
                        Hourly Rate
                      </span>
                      <span className="text-lg font-extrabold text-[#0F172A]">
                        {formatMoney(pro.price)}
                        <span className="text-sm font-medium text-gray-500">
                          /hr
                        </span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault(); /* Message logic */
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-100 text-gray-700 font-bold text-sm hover:border-[#5B48FC] hover:text-[#5B48FC] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault(); /* Book logic */
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#5B48FC] text-white font-bold text-sm hover:bg-[#4A38E0] shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <CalendarCheck className="w-4 h-4" /> Book
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More */}
        {filtered.length > 0 && (
          <div
            className="mt-12 flex justify-center animate-fade-in-up"
            style={{ animationDelay: "600ms" }}
          >
            <button className="px-8 py-3 rounded-full border-2 border-gray-200 text-gray-700 font-bold hover:border-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-all duration-300">
              Load More Professionals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
