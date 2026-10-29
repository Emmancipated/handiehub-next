"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Loader2,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

const formatPrice = (minor: string | number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(minor) / 100);

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const started = useRef(false);
  const [step, setStep] = useState<
    "init" | "payment" | "success" | "failed" | "error"
  >("init");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [amountMinor, setAmountMinor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get("orderId");
  const callbackReference =
    searchParams.get("trxref") || searchParams.get("reference");

  const initializePayment = useCallback(async () => {
    if (!orderId) {
      setStep("error");
      setError("Choose an order before starting checkout.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStep("error");
        setError(data?.error || "Payment initialization failed");
        return;
      }

      if (data.payment?.amountMinor != null) {
        setAmountMinor(String(data.payment.amountMinor));
      }

      if (data.authorizationUrl) {
        setCheckoutUrl(data.authorizationUrl);
        setStep("payment");
      } else {
        setStep("error");
        setError("Paystack did not return a checkout URL.");
      }
    } catch {
      setStep("error");
      setError("Could not reach the payment provider. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const verifyPayment = useCallback(async (reference: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/payments/verify?trxref=${encodeURIComponent(reference)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setStep("failed");
        setError(data?.error || "We could not verify your payment.");
        return;
      }
      if (data.payment?.amountMinor != null) {
        setAmountMinor(String(data.payment.amountMinor));
      }
      setStep("success");
    } catch {
      setStep("failed");
      setError("We could not verify your payment. Please contact support.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (callbackReference) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void verifyPayment(callbackReference);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initializePayment();
  }, [callbackReference, initializePayment, verifyPayment]);

  // Keep the payment page focused on Paystack; the receipt lives at a stable
  // URL so buyers can revisit or share it.
  useEffect(() => {
    if (step === "success" && orderId) {
      router.replace(`/checkout/success?orderId=${orderId}`);
    }
  }, [step, orderId, router]);

  if (isLoading || (step === "init" && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B48FC] mb-4" />
          <p className="text-[#131313] font-medium">
            {callbackReference ? "Verifying payment..." : "Preparing payment..."}
          </p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3] px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-[#EF4444]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-[#EF4444]" />
          </div>
          <h2 className="text-2xl font-bold text-[#131313] mb-2">
            Payment could not start
          </h2>
          <p className="text-[#868686] text-sm mb-8">
            {error || "Something went wrong. Please try again."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                started.current = true;
                void initializePayment();
              }}
              className="w-full py-3 rounded-xl bg-[#5B48FC] text-white font-semibold hover:bg-[#4A38E0] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/dashboard/customer/orders"
              className="block w-full py-3 rounded-xl border border-[#E8E8E8] text-[#131313] font-semibold hover:bg-white transition-colors"
            >
              Back to Orders
            </Link>
          </div>
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
              <h2 className="text-xl font-bold text-[#131313]">
                Secure Payment
              </h2>
              <p className="text-[#868686] text-sm mt-1">
                Complete your payment through Paystack
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-[#868686]">Order Total</p>
                  <p className="text-2xl font-bold text-[#131313]">
                    {amountMinor != null ? formatPrice(amountMinor) : "—"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Secure
                </span>
              </div>

              <div className="bg-[#F3F3F3] rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-5 h-5 text-[#5B48FC]" />
                  <span className="font-semibold text-[#131313]">
                    Pay with Card
                  </span>
                </div>
                <p className="text-sm text-[#868686]">
                  You will be redirected to Paystack&apos;s secure payment page
                  to complete your transaction.
                </p>
              </div>

              <button
                onClick={() => {
                  window.location.href = checkoutUrl;
                }}
                className="w-full py-4 rounded-xl bg-[#5B48FC] text-white font-semibold text-lg hover:bg-[#4A38E0] transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" /> Pay with Paystack
              </button>

              <div className="mt-6 text-center">
                <Link
                  href="/dashboard/customer/orders"
                  className="text-sm font-semibold text-[#5B48FC] hover:underline transition-colors"
                >
                  Return to orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B48FC] mb-4 mx-auto" />
          <p className="text-sm font-medium text-[#868686]">
            Payment confirmed. Opening your receipt…
          </p>
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
          <h2 className="text-2xl font-bold text-[#131313] mb-2">
            Payment Failed
          </h2>
          <p className="text-[#868686] text-sm mb-8">
            {error ||
              "We couldn't process your payment. Please try again or use a different payment method."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                if (orderId) {
                  router.replace(`/checkout/payment?orderId=${orderId}`);
                }
                started.current = true;
                void initializePayment();
              }}
              className="w-full py-3 rounded-xl bg-[#5B48FC] text-white font-semibold hover:bg-[#4A38E0] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/dashboard/customer/orders"
              className="block w-full py-3 rounded-xl border border-[#E8E8E8] text-[#131313] font-semibold hover:bg-white transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3]">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B48FC]" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
