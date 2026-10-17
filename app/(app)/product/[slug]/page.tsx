// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import {
//   ArrowLeft,
//   Share2,
//   Heart,
//   ShoppingCart,
//   Check,
//   Minus,
//   Plus,
//   Image as ImageIcon,
//   ImageMinus,
//   CheckCircle2,
//   AlertCircle,
//   User as UserIcon,
//   ShieldCheck,
//   Clock,
//   Star,
// } from "lucide-react";

// const PRIMARY = "#5B48FC";
// const SECONDARY = "#EFEDFF";
// const PRIMARY_BLACK = "#131313";
// const GRAY_TEXT = "#868686";

// const formatPrice = (minor: bigint | string | number) => {
//   const val = typeof minor === "bigint" ? Number(minor) : Number(minor);
//   return new Intl.NumberFormat("en-NG", {
//     style: "currency",
//     currency: "NGN",
//     minimumFractionDigits: 0,
//   }).format(val);
// };

// const MOCK_LISTING = {
//   id: "listing_1",
//   slug: "modern-black-chair",
//   title: "Ambience Black Chair",
//   description:
//     "Everything urgently available. Modern black furniture, we deliver worldwide. Premium quality with excellent craftsmanship.",
//   priceMinor: BigInt(24999),
//   currency: "NGN",
//   kind: "PRODUCT" as const,
//   status: "ACTIVE" as const,
//   stockOnHand: 15,
//   images: [
//     "https://images.unsplash.com/photo-1592078615290-033ee584e267?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//     "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//     "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
//   ],
//   seller: {
//     id: "seller_1",
//     firstName: "Ambience",
//     lastName: "Furniture",
//     email: "hello@ambience.com",
//     isVerified: true,
//     responseTime: "2 hours",
//   },
//   category: {
//     id: "cat_1",
//     name: "Furniture",
//     slug: "furniture",
//   },
//   attributes: {
//     material: "Solid Wood",
//     color: "Black",
//     dimensions: "80cm x 80cm x 75cm",
//     weight: "12kg",
//   },
//   rating: 4.5,
//   reviewCount: 223,
// };

// export default function ProductDetailPage() {
//   const { slug } = useParams();
//   const router = useRouter();
//   const [selectedImage, setSelectedImage] = useState(0);
//   const [quantity, setQuantity] = useState(1);
//   const [selectedColor, setSelectedColor] = useState(0);
//   const [checkingAvailability, setCheckingAvailability] = useState(false);

//   const colors = ["#000000", "#614A3D", "#CCCCCC"] as const;

//   const handleBuyNow = async () => {
//     try {
//       const res = await fetch("/api/orders", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           sellerId: MOCK_LISTING.seller.id,
//           items: [
//             {
//               listingId: MOCK_LISTING.id,
//               titleSnapshot: MOCK_LISTING.title,
//               unitPriceMinor: MOCK_LISTING.priceMinor.toString(),
//               quantity,
//             },
//           ],
//           currency: MOCK_LISTING.currency,
//         }),
//       });

//       if (res.ok) {
//         const data = await res.json();
//         router.push(`/checkout/payment?orderId=${data.order.id}`);
//       } else {
//         const err = await res.json();
//         alert(err.error || "Failed to create order");
//       }
//     } catch {
//       alert("Something went wrong");
//     }
//   };

//   const handleAddToCart = () => {
//     // In production, add to cart state
//     const event = new CustomEvent("addToCart", {
//       detail: { ...MOCK_LISTING, quantity },
//     });
//     window.dispatchEvent(event);
//     const btn = document.getElementById("addToCartBtn");
//     const original = btn?.innerHTML;
//     if (btn) {
//       btn.classList.add("bg-[#10B981]");
//       btn.classList.remove("bg-[#5B48FC]");
//       btn.innerHTML = "Added!";
//     }
//     setTimeout(() => {
//       if (btn) {
//         btn.classList.remove("bg-[#10B981]");
//         btn.classList.add("bg-[#5B48FC]");
//         btn.innerHTML = original || "Add to Cart";
//       }
//     }, 1500);
//   };

//   const renderStars = (rating: number) => {
//     const stars = [];
//     const fullStars = Math.floor(rating);
//     const halfStar = rating - fullStars >= 0.5;
//     for (let i = 0; i < 5; i++) {
//       if (i < fullStars) {
//         stars.push(
//           <Star key={i} className="w-4 h-4 fill-[#D79900] text-[#D79900]" />,
//         );
//       } else if (i === fullStars && halfStar) {
//         stars.push(
//           <Star key={i} className="w-4 h-4 fill-[#D79900] text-[#D79900]" />,
//         );
//       } else {
//         stars.push(<Star key={i} className="w-4 h-4 text-[#E8E8E8]" />);
//       }
//     }
//     return stars;
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Header */}
//       <header className="bg-white border-b border-[#E8E8E8] sticky top-0 z-20">
//         <div className="max-w-7xl mx-auto px-4 py-3">
//           <div className="flex items-center justify-between">
//             <button
//               onClick={() => router.back()}
//               className="p-2 text-[#131313] hover:text-[#5B48FC] rounded-full hover:bg-[#EFEDFF] transition-colors"
//             >
//               <ArrowLeft className="w-5 h-5" />
//             </button>
//             <div className="flex-1 mx-8 hidden md:flex justify-center">
//               <input
//                 type="text"
//                 placeholder="Search products, services..."
//                 className="w-80 pl-9 pr-4 py-2.5 rounded-full border border-[#E8E8E8] focus:ring-2 focus:ring-[#5B48FC] outline-none text-sm"
//               />
//             </div>
//             <div className="flex items-center gap-2">
//               <button className="p-2 text-[#131313] hover:text-[#5B48FC] rounded-full hover:bg-[#EFEDFF] transition-colors">
//                 <Heart className="w-5 h-5" />
//               </button>
//               <button className="p-2 text-[#131313] hover:text-[#5B48FC] rounded-full hover:bg-[#EFEDFF] transition-colors">
//                 <Share2 className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto px-4 py-6">
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
//           {/* Left Column - Images */}
//           <div className="lg:col-span-7 space-y-6">
//             <div className="relative h-[400px] rounded-2xl overflow-hidden bg-[#F3F3F3] shadow-sm">
//               <img
//                 src={MOCK_LISTING.images[selectedImage]}
//                 alt={MOCK_LISTING.title}
//                 className="w-full h-full object-cover transition-opacity duration-300"
//               />
//               <div className="absolute top-3 left-3 flex gap-2">
//                 <button
//                   className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white transition-colors"
//                   onClick={() => setSelectedImage(0)}
//                 >
//                   <ImageMinus className="w-4 h-4 text-[#131313]" />
//                 </button>
//               </div>
//               <div className="absolute bottom-3 right-3 flex gap-1">
//                 {MOCK_LISTING.images.map((_, i) => (
//                   <button
//                     key={i}
//                     onClick={() => setSelectedImage(i)}
//                     className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
//                       selectedImage === i
//                         ? "border-[#5B48FC] scale-110"
//                         : "border-transparent"
//                     }`}
//                   >
//                     <img
//                       src={MOCK_LISTING.images[i]}
//                       alt={`Thumbnail ${i + 1}`}
//                       className="w-full h-full object-cover"
//                     />
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
//               {MOCK_LISTING.images.map((img, i) => (
//                 <button
//                   key={i}
//                   onClick={() => setSelectedImage(i)}
//                   className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
//                     selectedImage === i
//                       ? "border-[#5B48FC]"
//                       : "border-transparent"
//                   }`}
//                 >
//                   <img
//                     src={img}
//                     alt={`Thumbnail ${i + 1}`}
//                     className="w-full h-full object-cover"
//                   />
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Right Column - Info */}
//           <div className="lg:col-span-5 space-y-6">
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#EFEDFF] text-[#5B48FC] text-xs font-semibold">
//                   {MOCK_LISTING.kind}
//                 </span>
//                 {MOCK_LISTING.isVerified !== undefined && (
//                   <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-semibold">
//                     <Check className="w-3 h-3" /> Verified
//                   </span>
//                 )}
//               </div>
//               <button className="p-2 rounded-full hover:bg-[#EFEDFF] transition-colors text-[#868686]">
//                 <Share2 className="w-5 h-5" />
//               </button>
//             </div>

//             <h1 className="text-2xl lg:text-3xl font-bold text-[#131313] leading-tight">
//               {MOCK_LISTING.title}
//             </h1>

//             <div className="flex items-center gap-3 mb-2">
//               <div className="flex text-[#D79900]">
//                 {renderStars(MOCK_LISTING.rating)}
//               </div>
//               <span className="text-sm text-[#868686]">
//                 ({MOCK_LISTING.reviewCount})
//               </span>
//             </div>

//             <div className="text-3xl font-bold text-[#131313] mb-6">
//               {formatPrice(MOCK_LISTING.priceMinor)}
//             </div>

//             {/* Seller Info */}
//             <div className="bg-[#F3F3F3] rounded-xl p-5 border border-[#E8E8E8]">
//               <div className="flex items-start gap-4 mb-4">
//                 <div className="w-12 h-12 rounded-full bg-[#EFEDFF] flex items-center justify-center overflow-hidden">
//                   <img
//                     src={
//                       MOCK_LISTING.seller.dp ||
//                       "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
//                     }
//                     alt="seller"
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-[#131313] text-sm">
//                     {MOCK_LISTING.seller.firstName}{" "}
//                     {MOCK_LISTING.seller.lastName}
//                   </h3>
//                   {MOCK_LISTING.seller.isVerified && (
//                     <span className="flex items-center gap-1 mt-1">
//                       <ShieldCheck className="w-3 h-3 text-[#5B48FC]" />
//                       <span className="text-xs text-[#5B48FC] font-medium">
//                         Verified
//                       </span>
//                     </span>
//                   )}
//                   <p className="text-xs text-[#868686] mt-1">
//                     Response time: {MOCK_LISTING.seller.responseTime}
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => router.push(`/seller/${MOCK_LISTING.seller.id}`)}
//                 className="w-full py-2.5 border border-[#E8E8E8] rounded-lg text-sm text-[#131313] hover:bg-[#5B48FC] hover:text-white transition-colors"
//               >
//                 View Seller Profile
//               </button>
//             </div>

//             {/* Color Selection */}
//             <div className="flex flex-col gap-3">
//               <label className="text-sm font-medium text-[#131313]">
//                 Color
//               </label>
//               <div className="flex gap-3">
//                 {colors.map((color, i) => (
//                   <button
//                     key={i}
//                     onClick={() => setSelectedColor(i)}
//                     className={`w-9 h-9 rounded-full border-2 transition-all ${
//                       selectedColor === i
//                         ? "border-[#5B48FC] ring-2 ring-[#5B48FC]/20"
//                         : "border-transparent"
//                     } style={{ backgroundColor: color }}`}
//                   />
//                 ))}
//               </div>
//             </div>

//             {/* Quantity */}
//             <div className="flex flex-col gap-3">
//               <label className="text-sm font-medium text-[#131313]">
//                 Quantity
//               </label>
//               <div className="flex items-center gap-1 border border-[#E8E8E8] rounded-lg bg-[#F3F3F3]">
//                 <button
//                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
//                   className="w-8 h-8 flex items-center justify-center hover:bg-white transition-colors"
//                 >
//                   <Minus className="w-4 h-4" />
//                 </button>
//                 <span className="w-8 text-center font-medium text-[#131313]">
//                   {quantity}
//                 </span>
//                 <button
//                   onClick={() => setQuantity(quantity + 1)}
//                   className="w-8 h-8 flex items-center justify-center hover:bg-white transition-colors"
//                 >
//                   <Plus className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>

//             {/* Check Availability */}
//             <button
//               onClick={() => {
//                 setCheckingAvailability(true);
//                 setTimeout(() => {
//                   setCheckingAvailability(false);
//                   alert(
//                     `${MOCK_LISTING.seller.firstName} has confirmed this item is available for delivery within 3-5 business days.`,
//                   );
//                 }, 1500);
//               }}
//               disabled={checkingAvailability}
//               className="w-full py-3 rounded-lg border border-[#E8E8E8] bg-[#EFEDFF] text-[#5B48FC] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
//             >
//               {checkingAvailability ? (
//                 <>
//                   <Clock className="w-4 h-4 animate-spin" /> Checking...
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle2 className="w-4 h-4" /> Check Availability
//                 </>
//               )}
//             </button>

//             {/* Action Buttons */}
//             <div className="grid grid-cols-2 gap-3">
//               <button
//                 id="addToCartBtn"
//                 onClick={handleAddToCart}
//                 className="flex items-center justify-center gap-2 py-3 rounded-lg border border-[#5B48FC] text-[#5B48FC] font-semibold hover:bg-[#5B48FC] hover:text-white transition-colors"
//               >
//                 <ShoppingCart className="w-4 h-4" />
//                 Add to Cart
//               </button>
//               <button
//                 onClick={handleBuyNow}
//                 className="flex items-center justify-center gap-2 py-3 rounded-lg bg-[#5B48FC] text-white font-semibold hover:bg-[#4A38E0] transition-colors"
//               >
//                 <Check className="w-4 h-4" />
//                 Buy Now
//               </button>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Heart,
  ShoppingCart,
  Check,
  Minus,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Star,
  MessageSquare,
  CalendarCheck,
  MapPin,
  ChevronRight,
  Info,
  ImageMinus,
} from "lucide-react";
import Link from "next/link";

const formatPrice = (minor: bigint | string | number) => {
  const val = typeof minor === "bigint" ? Number(minor) : Number(minor);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(val);
};

// Mock data: Notice the `kind` property dictates the UI
const MOCK_LISTING = {
  id: "listing_1",
  slug: "modern-black-chair",
  title: "Ambience Black Chair",
  description:
    "Everything urgently available. Modern black furniture, we deliver worldwide. Premium quality with excellent craftsmanship. Built with authentic materials to last a lifetime while elevating your space.",
  priceMinor: BigInt(24999),
  currency: "NGN",
  kind: "PRODUCT" as "PRODUCT" | "SERVICE", // Try changing this to "SERVICE" to see the UI adapt!
  status: "ACTIVE",
  stockOnHand: 15,
  images: [
    "https://images.unsplash.com/photo-1592078615290-033ee584e267?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
  ],
  seller: {
    id: "seller_1",
    firstName: "Ambience",
    lastName: "Furniture",
    businessName: "Ambience Furniture Ltd",
    dp: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    isVerified: true,
    responseTime: "1 hour",
  },
  category: { id: "cat_1", name: "Furniture" },
  attributes: {
    Material: "Solid Wood & Premium Leather",
    Dimensions: "80cm x 80cm x 75cm",
    Weight: "12kg",
    Warranty: "2 Years",
  },
  rating: 4.8,
  reviewCount: 223,
};

export default function ProductDetailPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Derived state for the dual-journey logic
  const isProduct = MOCK_LISTING.kind === "SERVICE";
  const colors = ["#0F172A", "#78350F", "#94A3B8"];

  const handleBuyOrBook = async () => {
    // Booking/Checkout logic here
    router.push(`/checkout/payment?orderId=123`);
  };

  const handleAddToCart = () => {
    const btn = document.getElementById("addToCartBtn");
    const original = btn?.innerHTML;
    if (btn) {
      btn.classList.add("bg-[#10B981]", "border-[#10B981]", "text-white");
      btn.classList.remove("text-[#5B48FC]", "border-[#5B48FC]");
      btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Added`;
    }
    setTimeout(() => {
      if (btn) {
        btn.classList.remove("bg-[#10B981]", "border-[#10B981]", "text-white");
        btn.classList.add("text-[#5B48FC]", "border-[#5B48FC]");
        btn.innerHTML = original || "";
      }
    }, 2000);
  };

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

      {/* 1. Header / Top Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500">
            <Link href="/" className="hover:text-[#5B48FC]">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/categories" className="hover:text-[#5B48FC]">
              {MOCK_LISTING.category.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#0F172A] truncate max-w-[200px]">
              {MOCK_LISTING.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSaved ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-[#0F172A]"}`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? "fill-red-500" : ""}`} />
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 hover:text-[#0F172A] transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* --- Left Column: Image Gallery --- */}

          {/* Left Column - Images */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative h-[400px] rounded-2xl overflow-hidden bg-[#F3F3F3] shadow-sm">
              <img
                src={MOCK_LISTING.images[selectedImage]}
                alt={MOCK_LISTING.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <button
                  className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white transition-colors"
                  onClick={() => setSelectedImage(0)}
                >
                  <ImageMinus className="w-4 h-4 text-[#131313]" />
                </button>
              </div>
              <div className="absolute bottom-3 right-3 flex gap-1">
                {MOCK_LISTING.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === i
                        ? "border-[#5B48FC] scale-110"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={MOCK_LISTING.images[i]}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {MOCK_LISTING.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i
                      ? "border-[#5B48FC]"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* --- Right Column: Details & Actions --- */}
          <div
            className="lg:col-span-5 space-y-8 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            {/* Title & Price */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] leading-tight mb-3">
                {MOCK_LISTING.title}
              </h1>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-[#0F172A] text-sm">
                    {MOCK_LISTING.rating}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-500 underline decoration-gray-300 underline-offset-4 cursor-pointer hover:text-[#5B48FC]">
                  {MOCK_LISTING.reviewCount} Reviews
                </span>
              </div>
              <div className="text-4xl font-extrabold text-[#0F172A]">
                {formatPrice(MOCK_LISTING.priceMinor)}
                {!isProduct && (
                  <span className="text-lg font-medium text-gray-400 ml-1">
                    /hr
                  </span>
                )}
              </div>
            </div>

            {/* Seller Card */}
            <div
              onClick={() => router.push(`/seller/${MOCK_LISTING.seller.id}`)}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-[#5B48FC]/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <img
                  src={MOCK_LISTING.seller.dp}
                  alt="seller"
                  className="w-14 h-14 rounded-full object-cover border border-gray-100"
                />
                <div>
                  <h3 className="font-bold text-[#0F172A] group-hover:text-[#5B48FC] transition-colors flex items-center gap-1.5">
                    {MOCK_LISTING.seller.businessName ||
                      `${MOCK_LISTING.seller.firstName} ${MOCK_LISTING.seller.lastName}`}
                    {MOCK_LISTING.seller.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                    )}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Replies in{" "}
                    {MOCK_LISTING.seller.responseTime}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#5B48FC] transition-colors" />
            </div>

            {/* Configuration (Adapts based on Product vs Service) */}
            <div className="space-y-6 py-6 border-y border-gray-100">
              {/* Conditional: Colors (Only for Products) */}
              {isProduct && (
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-[#0F172A]">
                    Select Color
                  </label>
                  <div className="flex gap-3">
                    {colors.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColor(i)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColor === i
                            ? "border-[#5B48FC] ring-4 ring-[#5B48FC]/10 scale-110"
                            : "border-gray-200 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Quantity / Hours */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-[#0F172A]">
                  {isProduct ? "Quantity" : "Hours Needed"}
                </label>
                <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 w-max">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-extrabold text-[#0F172A] text-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setCheckingAvailability(true);
                  setTimeout(() => {
                    setCheckingAvailability(false);
                    alert(
                      isProduct
                        ? "Item is in stock and ready for delivery."
                        : "Professional is available for booking this week.",
                    );
                  }, 1500);
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

              <div className="grid grid-cols-2 gap-3">
                {isProduct ? (
                  // Product Actions
                  <>
                    <button
                      id="addToCartBtn"
                      onClick={handleAddToCart}
                      className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-[#5B48FC] text-[#5B48FC] font-bold hover:bg-[#EFEDFF] transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-5 h-5" /> Add to Cart
                    </button>
                    <button
                      onClick={handleBuyOrBook}
                      className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#5B48FC] text-white font-bold shadow-md hover:bg-[#4A38E0] hover:shadow-lg transition-all active:scale-95"
                    >
                      Buy Now
                    </button>
                  </>
                ) : (
                  // Service Actions
                  <>
                    <button
                      onClick={() =>
                        router.push(
                          `/messages/new?seller=${MOCK_LISTING.seller.id}`,
                        )
                      }
                      className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-[#5B48FC] text-[#5B48FC] font-bold hover:bg-[#EFEDFF] transition-all active:scale-95"
                    >
                      <MessageSquare className="w-5 h-5" /> Message Pro
                    </button>
                    <button
                      onClick={handleBuyOrBook}
                      className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#5B48FC] text-white font-bold shadow-md hover:bg-[#4A38E0] hover:shadow-lg transition-all active:scale-95"
                    >
                      <CalendarCheck className="w-5 h-5" /> Book Now
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Buyer Protection Badge */}
            <div className="flex items-start gap-3 p-4 bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl mt-6">
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

        {/* --- Bottom Section: Description & Specs --- */}
        <div
          className="mt-16 pt-10 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
              <Info className="w-6 h-6 text-[#5B48FC]" /> Overview
            </h2>
            <p className="text-gray-600 leading-relaxed font-medium">
              {MOCK_LISTING.description}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#0F172A] mb-5">
                {isProduct ? "Specifications" : "Service Details"}
              </h3>
              <div className="space-y-4">
                {Object.entries(MOCK_LISTING.attributes).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                      {key}
                    </span>
                    <span className="text-sm font-bold text-[#0F172A] text-right ml-4">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
