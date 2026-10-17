"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle, Clock, Loader2 } from "lucide-react";

const PRIMARY = "#5B48FC";

export default function VerificationPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"code" | "success" | "error">("code");
  const [resendTimer, setResendTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email");
    if (e) setEmail(decodeURIComponent(e));
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    setIsVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid or expired code");
        setStep("error");
        return;
      }
      setStep("success");
    } catch {
      setError("A network error occurred. Please try again.");
      setStep("error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setError("");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendTimer(60);
    } catch {
      // ignore
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#EFEDFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#5B48FC]" />
          </div>
          <h1 className="text-3xl font-bold text-[#131313] mb-2">
            Verify Your Email
          </h1>
          <p className="text-[#868686] text-sm">
            We sent a verification code to{" "}
            <span className="font-medium text-[#131313]">{email || "your email"}</span>
          </p>
        </div>

        {step === "code" && (
          <div className="space-y-6">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={code[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d$/.test(val) || val === "") {
                      setCode((prev) => {
                        const arr = prev.split("");
                        arr[i] = val;
                        return arr.join("");
                      });
                    }
                  }}
                  className="w-10 h-12 text-center text-xl font-bold rounded-xl border border-[#E8E8E8] focus:border-[#5B48FC] focus:ring-2 focus:ring-[#EFEDFF] outline-none transition-all text-[#131313]"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <p className="text-[#868686]">
                Didn't receive the code?{" "}
                {resendTimer > 0 ? (
                  <span className="text-[#868686]">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-semibold text-[#5B48FC] hover:underline transition-colors"
                  >
                    {isResending ? "Sending..." : "Resend code"}
                  </button>
                )}
              </p>
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying || code.length !== 6}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-60 ${
                code.length === 6 ? `bg-[#5B48FC] hover:bg-[#4A38E0]` : "bg-[#EFEDFF] text-[#5B48FC]"
              }`}
            >
              {isVerifying ? <Loader2 className="w-4 h-4 mr-2" /> : ""}Verify Code
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-[#EFEDFF] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-[#5B48FC]" />
            </div>
            <h2 className="text-2xl font-bold text-[#131313]">Account Verified!</h2>
            <p className="text-[#868686] text-sm">
              Your account has been successfully verified. You can now log in.
            </p>
            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl font-semibold text-white bg-[#5B48FC] hover:bg-[#4A38E0] transition-colors text-center"
            >
              Go to Login
            </Link>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-[#868686]">
            Didn't receive code?{" "}
            <Link href="/auth/login" className="font-semibold text-[#5B48FC] hover:underline">
              Try logging in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}