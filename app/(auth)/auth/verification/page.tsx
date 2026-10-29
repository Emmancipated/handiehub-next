"use client";

import {
  useEffect,
  useState,
  useRef,
  KeyboardEvent,
  ClipboardEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Mail,
} from "lucide-react";

export default function VerificationPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [step, setStep] = useState<"code" | "success">("code");
  const [nextPath, setNextPath] = useState("/");
  const [resendTimer, setResendTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (e) setEmail(decodeURIComponent(e));
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  // --- OTP Input Logic ---
  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Take the last character if multiple are typed
    setCode(newCode);
    setError("");

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      // Move focus to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pastedData) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);

    // Focus the next empty input or the last one
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const currentCodeString = code.join("");
  const isComplete = currentCodeString.length === 6;

  // --- API Handlers ---
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isComplete) return;

    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: currentCodeString }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid or expired verification code.");
        return;
      }

      const data = await res.json().catch(() => ({}));
      const roles: string[] = data.user?.roles ?? [];

      // Verification issues the session cookie, so sync the auth context
      // before navigating.
      await refresh();
      setNextPath(roles.includes("SELLER") ? "/seller/onboarding" : "/");
      setStep("success");
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setError("");
    try {
      console.log("Resend verification request initiated, frontend");
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendTimer(60);
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // --- Success State UI ---
  if (step === "success") {
    return (
      <div className="w-full text-center lg:text-left animate-fade-in-up">
        <div className="w-16 h-16 bg-[#10B981]/10 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6 border border-[#10B981]/20">
          <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-3 tracking-tight">
          Account Verified!
        </h1>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          Your email address has been successfully verified and you&apos;re now
          signed in.
        </p>
        <button
          type="button"
          onClick={() => router.push(nextPath)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold bg-[#5B48FC] text-white hover:bg-[#4A38E0] shadow-md transition-all active:scale-[0.98]"
        >
          Continue to HandieHub <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // --- Verification Code UI ---
  return (
    <div className="w-full animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 text-center lg:text-left">
        <div className="w-16 h-16 bg-[#5B48FC]/10 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6 border border-[#5B48FC]/20">
          <Mail className="w-8 h-8 text-[#5B48FC]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-2 tracking-tight">
          Verify your email
        </h1>
        <p className="text-gray-500 font-medium">
          We&apos;ve sent a 6-digit code to <br className="hidden lg:block" />
          <span className="text-[#0F172A] font-bold">
            {email || "your email"}
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        {/* OTP Inputs */}
        <div className="flex justify-between sm:justify-start sm:gap-3">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              autoFocus={index === 0}
              className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-extrabold rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 transition-all text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${
                error
                  ? "border-red-300 bg-red-50/50 focus:border-red-400"
                  : "border-gray-200 focus:border-[#5B48FC]"
              }`}
            />
          ))}
        </div>

        {/* Resend Logic */}
        <div className="flex items-center text-sm font-medium">
          <span className="text-gray-500 mr-2">Didn&apos;t receive the code?</span>
          {resendTimer > 0 ? (
            <span className="text-[#0F172A] font-bold">
              Resend in {resendTimer}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-[#5B48FC] font-bold hover:text-[#4A38E0] hover:underline transition-colors disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Click to resend"}
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isVerifying || !isComplete}
          className={`w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-xl font-bold transition-all ${
            isComplete
              ? "bg-[#5B48FC] text-white hover:bg-[#4A38E0] shadow-md hover:shadow-lg active:scale-[0.98]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
            </>
          ) : (
            <>
              Verify Account <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer / Back Navigation */}
      <div className="mt-8 text-center lg:text-left pt-6 border-t border-gray-100">
        <Link
          href="/auth/login"
          className="text-sm font-bold text-gray-500 hover:text-[#0F172A] transition-colors"
        >
          Return to log in
        </Link>
      </div>
    </div>
  );
}
