// "use client";

// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import {
//   Search,
//   Star,
//   ShieldCheck,
//   ChevronRight,
//   Wrench,
//   Hammer,
//   Sparkles,
//   Zap,
//   Baby,
//   Flame,
//   Paintbrush,
//   TreePine,
//   LayoutGrid,
//   CheckCircle,
//   ArrowRight,
// } from "lucide-react";

// // --- Types & Mock Data (Same as previous) ---
// type ListingItem = {
//   id: string;
//   slug: string;
//   title: string;
//   description: string;
//   priceMinor: bigint | number;
//   currency: string;
//   images: string[];
//   seller: any;
//   category: any;
// };
// type ProductCardProps = {
//   id: string;
//   slug: string;
//   name: string;
//   price: number;
//   currency: string;
//   rating: number;
//   reviews: number;
//   description: string;
//   images: string[];
//   handiemanBizName: string;
//   dp: string | null;
//   isVerified: boolean;
//   responseTime: string;
// };

// const CATEGORY_ICONS: Record<string, React.ReactNode> = {
//   all: <LayoutGrid className="w-5 h-5" />,
//   plumbing: <Wrench className="w-5 h-5" />,
//   carpentry: <Hammer className="w-5 h-5" />,
//   cleaning: <Sparkles className="w-5 h-5" />,
//   nanny: <Baby className="w-5 h-5" />,
//   welding: <Flame className="w-5 h-5" />,
//   electrical: <Zap className="w-5 h-5" />,
//   painting: <Paintbrush className="w-5 h-5" />,
//   landscaping: <TreePine className="w-5 h-5" />,
// };

// const CATEGORY_DATA = [
//   {
//     id: "plumbing",
//     name: "Plumbing",
//     subCategories: ["Pipe Repair", "Leak Fix", "Installation"],
//   },
//   {
//     id: "carpentry",
//     name: "Carpentry",
//     subCategories: ["Furniture", "Cabinets", "Repair"],
//   },
//   {
//     id: "cleaning",
//     name: "Cleaning",
//     subCategories: ["Home", "Office", "Deep Clean"],
//   },
//   {
//     id: "welding",
//     name: "Welding",
//     subCategories: ["Metal Work", "Gates", "Repair"],
//   },
//   {
//     id: "electrical",
//     name: "Electrical",
//     subCategories: ["Wiring", "Lighting", "Repair"],
//   },
//   {
//     id: "painting",
//     name: "Painting",
//     subCategories: ["Interior", "Exterior", "Touch-up"],
//   },
//   {
//     id: "landscaping",
//     name: "Landscaping",
//     subCategories: ["Garden", "Lawn", "Tree Care"],
//   },
//   {
//     id: "nanny",
//     name: "Childcare",
//     subCategories: ["Babysitting", "Tutoring", "Elder Care"],
//   },
// ];

// const MOCK_PRODUCTS = [
//   {
//     id: "1",
//     slug: "modern-black-chair",
//     name: "Ambience Black Chair",
//     price: 24999,
//     currency: "NGN",
//     rating: 4.8,
//     reviews: 223,
//     description:
//       "Premium modern black furniture. Quick delivery available worldwide.",
//     images: [
//       "https://images.unsplash.com/photo-1592078615290-033ee584e267?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//     ],
//     handiemanBizName: "Ambience Furniture",
//     dp: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
//     isVerified: true,
//     responseTime: "Responds in 2 hours",
//   },
//   {
//     id: "2",
//     slug: "modern-sofa-set",
//     name: "Modern Leather Sofa Set",
//     price: 189999,
//     currency: "NGN",
//     rating: 4.9,
//     reviews: 156,
//     description:
//       "Premium leather sofa set for modern living rooms. Comfort meets style.",
//     images: [
//       "https://images.unsplash.com/photo-1555046833-cb90598087fe?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//     ],
//     handiemanBizName: "Comfort Living",
//     dp: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
//     isVerified: true,
//     responseTime: "Responds in 1 hour",
//   },
//   {
//     id: "3",
//     slug: "dining-table-set",
//     name: "Wooden Dining Table Set",
//     price: 125000,
//     currency: "NGN",
//     rating: 4.7,
//     reviews: 89,
//     description:
//       "Solid wood dining table with 6 chairs. Perfect for family gatherings.",
//     images: [
//       "https://images.unsplash.com/photo-1533731822071-d6d1f79d2e40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//     ],
//     handiemanBizName: "WoodWorks Nigeria",
//     dp: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
//     isVerified: true,
//     responseTime: "Responds in 3 hours",
//   },
//   {
//     id: "4",
//     slug: "home-cleaning-service",
//     name: "Deep Home Cleaning",
//     price: 35000,
//     currency: "NGN",
//     rating: 5.0,
//     reviews: 412,
//     description:
//       "Complete deep cleaning of your home including sanitization of all surfaces.",
//     images: [
//       "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//     ],
//     handiemanBizName: "Pristine Cleaners",
//     dp: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
//     isVerified: true,
//     responseTime: "Responds in 30 mins",
//   },
// ];

// export default function HomePage() {
//   const router = useRouter();
//   const [products, setProducts] = useState(MOCK_PRODUCTS);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;
//     const fetchListings = async () => {
//       try {
//         const res = await fetch("/api/listings?page=1&limit=20", {
//           headers: { "Content-Type": "application/json" },
//         });
//         if (res.ok) {
//           const data = await res.json();
//           const mapped = (data.listings || []).map((listing: ListingItem) => ({
//             id: listing.id,
//             slug: listing.slug,
//             name: listing.title,
//             price: Number(listing.priceMinor) / 100,
//             currency: listing.currency,
//             rating: 4.5,
//             reviews: 0,
//             description: listing.description,
//             images: listing.images || [],
//             handiemanBizName: listing.seller
//               ? `${listing.seller.firstName} ${listing.seller.lastName}`
//               : "Seller",
//             dp: null,
//             isVerified: false,
//             responseTime: "Responds in 1 hour",
//           }));
//           if (!cancelled && mapped.length > 0) setProducts(mapped);
//         }
//       } catch {
//         /* mock data fallback */
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };
//     fetchListings();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   return (
//     <div className="min-h-screen bg-white text-[#131313] font-sans">
//       {/*
//         INLINE STYLES FOR SMOOTH ENTRANCES
//         (No need to touch tailwind.config.js - this runs cleanly out of the box)
//       */}
//       <style
//         dangerouslySetInnerHTML={{
//           __html: `
//         @keyframes fadeInUp {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes breathe {
//           0%, 100% { opacity: 0.5; transform: scale(1); }
//           50% { opacity: 0.8; transform: scale(1.05); }
//         }
//         .animate-fade-in-up {
//           opacity: 0;
//           animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//         }
//         .animate-breathe {
//           animation: breathe 10s ease-in-out infinite;
//         }
//       `,
//         }}
//       />

//       {/* 1. Hero Section */}
//       <section className="relative bg-[#0A0A0A] text-white pt-28 pb-32 px-4 overflow-hidden border-b border-white/5">
//         {/* Subtle Fading Background Image */}
//         <div className="absolute inset-0 z-0 pointer-events-none">
//           <img
//             src="https://images.unsplash.com/photo-1504148455328-c376907d081c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
//             alt="Craftsmanship and Tools"
//             className="w-full h-full object-cover opacity-15 mix-blend-luminosity"
//           />
//           <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent"></div>
//           <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent"></div>
//         </div>

//         {/* Ambient Brand Glow with Breathing Animation */}
//         <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-[#5B48FC]/15 rounded-full blur-[130px] pointer-events-none z-0 animate-breathe"></div>

//         {/* Main Content (With Staggered Fade-in) */}
//         <div className="relative z-10 max-w-6xl mx-auto">
//           <h1
//             className="animate-fade-in-up text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-[1.1] text-white"
//             style={{ animationDelay: "100ms" }}
//           >
//             Find skilled professionals <br className="hidden md:block" />
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#868686]">
//               and quality products.
//             </span>
//           </h1>

//           <p
//             className="animate-fade-in-up text-lg text-gray-400 mb-10 max-w-2xl font-medium"
//             style={{ animationDelay: "250ms" }}
//           >
//             From expert plumbing and carpentry to premium furniture and
//             materials. Book reliable local hands or shop items right away.
//           </p>

//           {/* Search Bar with Focus Elevation */}
//           <div
//             className="animate-fade-in-up w-full max-w-3xl flex items-center bg-white rounded-xl overflow-hidden h-16 shadow-2xl shadow-black/50 border border-white/10 focus-within:ring-4 focus-within:ring-[#5B48FC]/30 focus-within:-translate-y-1 transition-all duration-300"
//             style={{ animationDelay: "400ms" }}
//           >
//             <div className="pl-5 pr-3 text-gray-400">
//               <Search className="w-6 h-6" />
//             </div>
//             <input
//               type="text"
//               placeholder="Search for plumbers, furniture, electrical repair..."
//               className="w-full h-full text-lg outline-none bg-transparent placeholder:text-gray-400 text-[#131313] font-medium"
//             />
//             <div className="pr-2 py-2 h-full">
//               <button className="bg-[#5B48FC] hover:bg-[#4a3ae6] active:scale-95 text-white px-8 h-full rounded-lg font-bold transition-all shadow-sm whitespace-nowrap">
//                 Search
//               </button>
//             </div>
//           </div>

//           {/* Popular Tags */}
//           <div
//             className="animate-fade-in-up mt-8 flex flex-wrap items-center gap-3 text-sm"
//             style={{ animationDelay: "550ms" }}
//           >
//             <span className="text-gray-400 font-medium">Popular:</span>
//             {[
//               "Plumbing",
//               "Carpentry",
//               "Deep Cleaning",
//               "Furniture",
//               "Welding",
//             ].map((tag) => (
//               <button
//                 key={tag}
//                 className="px-4 py-2 rounded-full border border-white/10 text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/5 hover:-translate-y-0.5 backdrop-blur-sm transition-all duration-200"
//               >
//                 {tag}
//               </button>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* 2. Horizontal Category Navigation */}
//       <div className="border-b border-gray-200 bg-white sticky top-16 z-30 shadow-sm/50">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="flex overflow-x-auto scrollbar-hide py-4 gap-8 text-sm font-medium text-gray-500">
//             {CATEGORY_DATA.map((cat) => (
//               <Link
//                 key={cat.id}
//                 href={`/category/${cat.id}`}
//                 className="group whitespace-nowrap flex items-center gap-2 hover:text-[#5B48FC] transition-colors"
//               >
//                 <span className="group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
//                   {CATEGORY_ICONS[cat.id]}
//                 </span>
//                 {cat.name}
//               </Link>
//             ))}
//           </div>
//         </div>
//       </div>

//       <main className="max-w-7xl mx-auto px-4 py-16 space-y-24">
//         {/* 3. Featured Services Grid */}
//         <section>
//           <div className="flex items-center justify-between mb-8">
//             <h2 className="text-2xl md:text-3xl font-bold text-[#131313] tracking-tight">
//               Featured Offers & Pros
//             </h2>
//             <Link
//               href="/handieman"
//               className="group flex items-center text-[#5B48FC] font-medium hover:underline"
//             >
//               See all{" "}
//               <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
//             </Link>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             {products.map((product) => (
//               <ListingCard
//                 key={product.id}
//                 product={product}
//                 onClick={() => router.push(`/product/${product.slug}`)}
//               />
//             ))}
//           </div>
//         </section>

//         {/* 4. Value Proposition (Trust Section) */}
//         <section className="bg-gray-50 rounded-3xl p-8 md:p-16 border border-gray-200 hover:shadow-lg transition-shadow duration-500">
//           <h2 className="text-3xl font-bold text-[#131313] mb-10 tracking-tight">
//             A network of tools, talent, and trust.
//           </h2>
//           <div className="grid md:grid-cols-3 gap-10">
//             {[
//               {
//                 title: "Verified Tradesmen",
//                 desc: "Every professional undergoes identity and skill verification before offering services.",
//               },
//               {
//                 title: "Secure Transactions",
//                 desc: "Your payment is held safely until the product is delivered or the job is done right.",
//               },
//               {
//                 title: "Real Client Reviews",
//                 desc: "Read honest feedback from past clients to ensure you hire the best person for the job.",
//               },
//             ].map((feature, i) => (
//               <div key={i} className="group cursor-default">
//                 <div className="flex items-center gap-3 mb-4">
//                   <div className="w-10 h-10 rounded-full bg-[#EFEDFF] text-[#5B48FC] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#5B48FC] group-hover:text-white transition-all duration-300">
//                     <CheckCircle className="w-5 h-5" />
//                   </div>
//                   <h3 className="text-lg font-bold text-[#131313]">
//                     {feature.title}
//                   </h3>
//                 </div>
//                 <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
//                   {feature.desc}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* 5. Bottom Call to Action */}
//         <section className="relative bg-[#5B48FC] rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 text-white overflow-hidden group">
//           {/* subtle background decoration for CTA */}
//           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

//           <div className="relative z-10 max-w-xl">
//             <h2 className="text-3xl md:text-4xl font-bold mb-4">
//               Ready to get the job done?
//             </h2>
//             <p className="text-lg text-[#EFEDFF]">
//               Join thousands of customers and craftsmen relying on HandieHub
//               every day.
//             </p>
//           </div>
//           <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-shrink-0">
//             <Link
//               href="/categories"
//               className="bg-white text-[#5B48FC] py-3 px-8 rounded-lg font-bold text-center hover:bg-gray-50 active:scale-95 transition-all shadow-lg hover:shadow-xl"
//             >
//               Hire a Pro
//             </Link>
//             <Link
//               href="/auth/signup"
//               className="border border-white text-white py-3 px-8 rounded-lg font-bold text-center hover:bg-white/10 active:scale-95 transition-all"
//             >
//               Start Earning
//             </Link>
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// }

// // --- Subcomponents ---

// function ListingCard({
//   product,
//   onClick,
// }: {
//   product: ProductCardProps;
//   onClick: () => void;
// }) {
//   const formatPrice = (price: number) => {
//     return new Intl.NumberFormat("en-NG", {
//       style: "currency",
//       currency: "NGN",
//       minimumFractionDigits: 0,
//     }).format(price);
//   };

//   return (
//     <div
//       onClick={onClick}
//       // Micro-animation: Slight lift and shadow on the entire card on hover
//       className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full"
//     >
//       {/* Thumbnail */}
//       <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
//         <img
//           src={product.images[0]}
//           alt={product.name}
//           // Micro-animation: Image slowly scales up when the card is hovered
//           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
//         />
//       </div>

//       {/* Content */}
//       <div className="p-5 flex flex-col flex-grow">
//         <div className="flex items-center gap-2 mb-3">
//           <img
//             src={
//               product.dp ||
//               `https://ui-avatars.com/api/?name=${encodeURIComponent(product.handiemanBizName)}&background=131313&color=fff`
//             }
//             alt={product.handiemanBizName}
//             className="w-6 h-6 rounded-full"
//           />
//           <span className="text-sm font-bold text-[#131313] truncate">
//             {product.handiemanBizName}
//           </span>
//           {product.isVerified && (
//             <ShieldCheck className="w-4 h-4 text-[#5B48FC]" />
//           )}
//         </div>

//         <h3 className="text-base font-medium text-[#131313] line-clamp-2 mb-2 group-hover:text-[#5B48FC] transition-colors duration-200 leading-snug">
//           {product.name}
//         </h3>

//         <div className="flex items-center gap-1 mb-4">
//           <Star className="w-4 h-4 fill-[#131313] text-[#131313]" />
//           <span className="text-sm font-bold text-[#131313]">
//             {product.rating.toFixed(1)}
//           </span>
//           <span className="text-sm text-gray-500">({product.reviews})</span>
//         </div>

//         <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
//           <div className="flex flex-col">
//             <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
//               Starting at
//             </span>
//             <span className="text-lg font-extrabold text-[#131313]">
//               {formatPrice(product.price)}
//             </span>
//           </div>
//           {/* Micro-animation: The little arrow slides right when card is hovered */}
//           <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#EFEDFF] group-hover:text-[#5B48FC] transition-colors duration-300">
//             <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#5B48FC] group-hover:translate-x-0.5 transition-all" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  Star,
  ShieldCheck,
  Wrench,
  Hammer,
  Sparkles,
  Zap,
  Flame,
  Paintbrush,
  Sofa,
  CheckCircle,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

// --- Mock Data ---
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  plumbing: <Wrench className="w-5 h-5" />,
  carpentry: <Hammer className="w-5 h-5" />,
  cleaning: <Sparkles className="w-5 h-5" />,
  welding: <Flame className="w-5 h-5" />,
  electrical: <Zap className="w-5 h-5" />,
  painting: <Paintbrush className="w-5 h-5" />,
  furniture: <Sofa className="w-5 h-5" />,
};

const CATEGORY_DATA = [
  { id: "plumbing", name: "Plumbing Service" },
  { id: "furniture", name: "Furniture & Decor" },
  { id: "carpentry", name: "Carpentry" },
  { id: "electrical", name: "Electrical" },
  { id: "cleaning", name: "Deep Cleaning" },
  { id: "welding", name: "Metalwork & Welding" },
];

const MOCK_SERVICES = [
  {
    id: "s1",
    slug: "master-plumber",
    name: "Master Plumber: Leak Repair & Piping",
    price: 15000,
    rating: 5.0,
    reviews: 142,
    seller: "FixIt Right Plumbers",
    dp: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
    isVerified: true,
  },
  {
    id: "s2",
    slug: "custom-carpentry",
    name: "Custom Cabinetry & Furniture Repair",
    price: 25000,
    rating: 4.8,
    reviews: 89,
    seller: "WoodWorks Pro",
    dp: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    isVerified: true,
  },
  {
    id: "s3",
    slug: "electrical-wiring",
    name: "Home Electrical Wiring & Lighting",
    price: 20000,
    rating: 4.9,
    reviews: 210,
    seller: "Spark Electricals",
    dp: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
    isVerified: true,
  },
  {
    id: "s4",
    slug: "deep-cleaning",
    name: "Post-Construction Deep Cleaning",
    price: 35000,
    rating: 4.7,
    reviews: 312,
    seller: "Pristine Cleaners",
    dp: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80",
    isVerified: true,
  },
];

const MOCK_PRODUCTS = [
  {
    id: "p1",
    slug: "industrial-workbench",
    name: "Heavy Duty Industrial Workbench",
    price: 85000,
    rating: 4.8,
    reviews: 45,
    seller: "MetalCrafters",
    image:
      "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&q=80",
  },
  {
    id: "p2",
    slug: "leather-sofa",
    name: "Premium Leather 3-Seater Sofa",
    price: 189000,
    rating: 4.9,
    reviews: 124,
    seller: "Comfort Living",
    image:
      "https://images.unsplash.com/photo-1555046833-cb90598087fe?w=600&q=80",
  },
  {
    id: "p3",
    slug: "bathroom-faucet",
    name: "Matte Black Modern Sink Faucet",
    price: 32000,
    rating: 4.6,
    reviews: 89,
    seller: "PlumbSupplies",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80",
  },
  {
    id: "p4",
    slug: "paint-set",
    name: "Premium Wall Paint Set (20L)",
    price: 45000,
    rating: 4.7,
    reviews: 56,
    seller: "ColorPro Paints",
    image:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80",
  },
];

export default function HomePage() {
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
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

          <div
            className="animate-fade-in-up w-full max-w-3xl flex items-center bg-white rounded-xl overflow-hidden h-16 shadow-2xl shadow-black/50 border border-white/10 focus-within:ring-4 focus-within:ring-[#5B48FC]/30 focus-within:-translate-y-1 transition-all duration-300"
            style={{ animationDelay: "400ms" }}
          >
            <div className="pl-5 pr-3 text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              placeholder="Search for plumbers, furniture, paint, electricians..."
              className="w-full h-full text-lg outline-none bg-transparent placeholder:text-gray-400 text-[#131313] font-medium"
            />
            <div className="pr-2 py-2 h-full">
              <button className="bg-[#5B48FC] hover:bg-[#4a3ae6] active:scale-95 text-white px-8 h-full rounded-lg font-bold transition-all shadow-sm">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sub Navigation */}
      <div className="border-b border-gray-200 bg-white sticky top-16 z-30 shadow-sm/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide py-4 gap-8 text-sm font-medium text-gray-500">
            {CATEGORY_DATA.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="group whitespace-nowrap flex items-center gap-2 hover:text-[#5B48FC] transition-colors"
              >
                <span className="group-hover:rotate-6 group-hover:scale-110 transition-transform">
                  {CATEGORY_ICONS[cat.id]}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_SERVICES.map((service) => (
              <div
                key={service.id}
                onClick={() => router.push(`/product/${service.slug}`)}
                className="group flex flex-col bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center mb-4 pt-2">
                  <div className="relative mb-3">
                    <img
                      src={service.dp}
                      alt={service.seller}
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 group-hover:border-[#EFEDFF] transition-colors"
                    />
                    {service.isVerified && (
                      <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
                        <ShieldCheck className="w-5 h-5 text-[#5B48FC]" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {service.seller}
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-[#131313]">
                      {service.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({service.reviews})
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-medium text-center text-[#131313] line-clamp-2 mb-4 group-hover:text-[#5B48FC] transition-colors">
                  {service.name}
                </h3>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                      Starting at
                    </span>
                    <span className="block text-lg font-extrabold text-[#131313]">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                  <button className="text-sm font-bold text-[#5B48FC] bg-[#EFEDFF] px-4 py-2 rounded-lg group-hover:bg-[#5B48FC] group-hover:text-white transition-colors">
                    Book Pro
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. PRODUCTS SECTION */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#131313] tracking-tight">
                Premium Materials & Goods
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_PRODUCTS.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/product/${product.slug}`)}
                className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-[#5B48FC]/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#0F172A] text-xs font-bold px-2.5 py-1.5 rounded-md shadow-sm">
                    {product.seller}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-base font-medium text-[#131313] line-clamp-2 mb-2 group-hover:text-[#5B48FC] transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-4">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-[#131313]">
                      {product.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({product.reviews})
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                    <span className="text-lg font-extrabold text-[#131313]">
                      {formatPrice(product.price)}
                    </span>
                    <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#5B48FC] group-hover:text-white transition-colors">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 4. Value Proposition (Trust Section) */}
      <section className="bg-gray-50 rounded-3xl p-8 md:p-16 border border-gray-200 hover:shadow-lg transition-shadow duration-500">
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
          ].map((feature, i) => (
            <div key={i} className="group cursor-default">
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

      {/* 5. Bottom Call to Action */}
      <section className="relative bg-[#5B48FC] rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 text-white overflow-hidden group">
        {/* subtle background decoration for CTA */}
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
            href="/categories"
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
