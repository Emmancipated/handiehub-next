"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, Briefcase, ArrowRight, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"buyer" | "seller" | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProceed = () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    // Short delay for the button animation to feel smooth
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/auth/signup/details?accountType=${selectedType}`);
    }, 300);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-2 tracking-tight">
          Join HandieHub
        </h1>
        <p className="text-gray-500 font-medium">
          How would you like to use the platform?
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {/* Option 1: Buyer/User */}
        <button
          onClick={() => setSelectedType("buyer")}
          disabled={isSubmitting}
          className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${
            selectedType === "buyer"
              ? "border-[#5B48FC] bg-[#EFEDFF]/30 shadow-md scale-[1.02]"
              : "border-gray-200 bg-white hover:border-[#5B48FC]/50 hover:bg-gray-50"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              selectedType === "buyer"
                ? "bg-[#5B48FC] text-white"
                : "bg-gray-100 text-gray-500 group-hover:bg-[#EFEDFF] group-hover:text-[#5B48FC]"
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-[#0F172A] text-lg">Customer</h3>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedType === "buyer"
                    ? "border-[#5B48FC] bg-[#5B48FC]"
                    : "border-gray-300"
                }`}
              >
                {selectedType === "buyer" && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Hire skilled professionals and shop for premium materials and
              products.
            </p>
          </div>
        </button>

        {/* Option 2: Seller/Handieman */}
        <button
          onClick={() => setSelectedType("seller")}
          disabled={isSubmitting}
          className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${
            selectedType === "seller"
              ? "border-[#5B48FC] bg-[#EFEDFF]/30 shadow-md scale-[1.02]"
              : "border-gray-200 bg-white hover:border-[#5B48FC]/50 hover:bg-gray-50"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              selectedType === "seller"
                ? "bg-[#5B48FC] text-white"
                : "bg-gray-100 text-gray-500 group-hover:bg-[#EFEDFF] group-hover:text-[#5B48FC]"
            }`}
          >
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-[#0F172A] text-lg">Professional</h3>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedType === "seller"
                    ? "border-[#5B48FC] bg-[#5B48FC]"
                    : "border-gray-300"
                }`}
              >
                {selectedType === "seller" && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Offer your services, sell your products, and grow your business.
            </p>
          </div>
        </button>
      </div>

      <button
        onClick={handleProceed}
        disabled={!selectedType || isSubmitting}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${
          selectedType
            ? "bg-[#5B48FC] text-white hover:bg-[#4A38E0] shadow-md hover:shadow-lg active:scale-[0.98]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isSubmitting ? (
          "Proceeding..."
        ) : (
          <>
            Continue <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="mt-8 text-center lg:text-left pt-6 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-600">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-bold text-[#5B48FC] hover:underline transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
