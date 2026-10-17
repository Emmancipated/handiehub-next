"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CreditCard,
  Mail,
  ShieldCheck,
  Clock,
} from "lucide-react";

const PRIMARY = "#5B48FC";

const formatPrice = (minor: bigint | string | number) => {
  const val = typeof minor === "bigint" ? Number(minor) : Number(minor);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(val);
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState("init");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get("orderId");
  const orderAmount = 24999; // In production, fetch from order data

  useEffect(() => {
    if (orderId && step === "init") {
      initializePayment();
    }
  }, [orderId, step]);

  const initializePayment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          email: "customer@example.com",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authorizationUrl) {
          setCheckoutUrl(data.authorizationUrl);
          setStep("payment");
        } else {
          setError(data.error || "Failed to initialize payment");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Payment initialization failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async (reference: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payments/verify?trxref=${encodeURIComponent(reference)}`);
      if (res.ok) {
        setStep("success");
        router.push("/");
      } else {
        setStep("failed");
      }
    } catch {
      setStep("failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "init" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B48FC] mb-4" />
          <p className="text-[#131313] font-medium">Preparing payment...</p>
        </div>
      </div>
    );
  }

  if (step === "payment" && checkoutUrl) {
    return (
      <div className="min-h-screen bg-[#F3F3F3]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] overflow-hidden">
            <div className="p-6 border-b border-[#E8E8E8]">
              <h2 className="text-xl font-bold text-[#131313]">Secure Payment</h2>
              <p className="text-[#868686] text-sm mt-1">
                Complete your payment through Paystack
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-[#868686]">Order Total</p>
                  <p className="text-2xl font-bold text-[#131313]">{formatPrice(orderAmount)}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Secure
                </span>
              </div>

              <div className="bg-[#F3F3F3] rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-5 h-5 text-[#5B48FC]" />
                  <span className="font-semibold text-[#131313]">Pay with Card</span>
                </div>
                <p className="text-sm text-[#868686]">
                  You will be redirected to Paystack's secure payment page to complete your transaction.
                </p>
              </div>

              <button
                onClick={() => {
                  window.location.href = checkoutUrl;
                }}
                className="w-full py-4 rounded-xl bg-[#5B48FC] text-white font-semibold text-lg hover:bg-[#4A38E0] transition-colors flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4" /> Pay with Paystack
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-[#868686]">
                  Or{" "}
                  <Link
                    href="/"
                    className="font-semibold text-[#5B48FC] hover:underline transition-colors"
                  >
                    return to shopping
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3] px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
          </div>
          <h2 className="text-2xl font-bold text-[#131313] mb-2">Payment Successful!</h2>
          <p className="text-[#868686] text-sm mb-8">
            Your order has been placed successfully. You'll receive a confirmation email shortly.
          </p>
          </div>
        <div className="text-center mt-8">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-[#5B48FC] text-white font-semibold hover:bg-[#4A38E0] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3] px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-[#EF4444]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-[#EF4444]" />
          </div>
          <h2 className="text-2xl font-bold text-[#131313] mb-2">Payment Failed</h2>
          <p className="text-[#868686] text-sm mb-8">
            We couldn't process your payment. Please try again or use a different payment method.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setStep("payment")}
              className="w-full py-3 rounded-xl bg-[#5B48FC] text-white font-semibold hover:bg-[#4A38E0] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="w-full py-3 rounded-xl border border-[#E8E8E8] text-[#131313] font-semibold hover:bg-[#F3F3F3] transition-colors"
            >
              Back to Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
