"use client";

import {
  Suspense,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  getPasswordError,
  PASSWORD_HINT,
} from "@/lib/auth/passwordPolicy";
import { useAuth } from "@/components/auth/AuthProvider";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const emailParam = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentCode = code.join("");
  const isCodeComplete = currentCode.length === 6;
  const isPasswordValid = getPasswordError(password) === null;
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const canSubmit =
    email.trim().length > 0 &&
    isCodeComplete &&
    isPasswordValid &&
    passwordsMatch;

  // --- OTP input logic (mirrors the verification page) ---
  const handleCodeInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const next = [...code];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setCode(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: currentCode,
          newPassword: password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error || "Could not reset your password. Please try again.",
        );
        return;
      }

      // The API sets the session cookie, so sync the auth context.
      await refresh();
      setStep("success");
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          Password updated
        </h1>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          Your password has been reset and you are now signed in.
        </p>
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold bg-[#5B48FC] text-white hover:bg-[#4A38E0] shadow-md transition-all active:scale-[0.98]"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // --- Reset Form UI ---
  return (
    <div className="w-full animate-fade-in-up">
      <div className="mb-8 text-center lg:text-left">
        <div className="w-16 h-16 bg-[#5B48FC]/10 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6 border border-[#5B48FC]/20">
          <KeyRound className="w-8 h-8 text-[#5B48FC]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-2 tracking-tight">
          Reset password
        </h1>
        <p className="text-gray-500 font-medium leading-relaxed">
          Enter the 6-digit code from your email and choose a new password.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Reset code */}
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
            Reset Code
          </label>
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
                onChange={(e) => handleCodeInput(index, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                onPaste={handleCodePaste}
                autoFocus={index === 0 && emailParam.length > 0}
                className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-extrabold rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 transition-all text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${
                  error
                    ? "border-red-300 bg-red-50/50 focus:border-red-400"
                    : "border-gray-200 focus:border-[#5B48FC]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
            New Password
          </label>
          <PasswordInput
            icon={
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
            }
            placeholder="••••••••"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setError("");
            }}
            minLength={8}
            className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm"
          />
          {password.length > 0 && !isPasswordValid ? (
            <p className="text-xs font-semibold text-red-500 mt-1.5">
              {getPasswordError(password)}
            </p>
          ) : (
            <p className="text-xs text-gray-500 font-medium mt-1.5">
              {PASSWORD_HINT}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
            Confirm Password
          </label>
          <PasswordInput
            icon={
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
            }
            placeholder="••••••••"
            value={confirm}
            onChange={(value) => {
              setConfirm(value);
              setError("");
            }}
            className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm"
          />
          {confirm.length > 0 && !passwordsMatch && (
            <p className="text-xs font-semibold text-red-500 mt-1.5">
              Passwords do not match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className={`w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-xl font-bold transition-all ${
            canSubmit
              ? "bg-[#5B48FC] text-white hover:bg-[#4A38E0] shadow-md hover:shadow-lg active:scale-[0.98]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Updating...
            </>
          ) : (
            <>
              Update Password <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center lg:text-left pt-6 border-t border-gray-100">
        <Link
          href="/auth/forgot-password"
          className="text-sm font-bold text-gray-500 hover:text-[#0F172A] transition-colors"
        >
          Didn&apos;t get a code? Request a new one
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
