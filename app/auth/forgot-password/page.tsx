"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success to avoid email enumeration
      setIsSent(true);
    } catch {
      // Always show success to avoid email enumeration
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Success State UI ---
  if (isSent) {
    return (
      <div className="w-full text-center lg:text-left animate-fade-in-up">
        <div className="w-16 h-16 bg-[#5B48FC]/10 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6 border border-[#5B48FC]/20">
          <Mail className="w-8 h-8 text-[#5B48FC]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-3 tracking-tight">
          Check your inbox
        </h1>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          We've sent a password recovery code to{" "}
          <span className="text-[#0F172A] font-bold">{email}</span>. Please
          check your email and enter the code on the next page.
        </p>
        <Link
          href="/auth/reset-password"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold bg-[#5B48FC] text-white hover:bg-[#4A38E0] shadow-md transition-all active:scale-[0.98]"
        >
          Enter Reset Code <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-sm font-medium text-gray-500 mt-6">
          Didn't receive the email?{" "}
          <button
            onClick={() => setIsSent(false)}
            className="text-[#5B48FC] font-bold hover:underline"
          >
            Click to resend
          </button>
        </p>
      </div>
    );
  }

  // --- Request Reset Code Form UI ---
  return (
    <div className="w-full animate-fade-in-up">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-2 tracking-tight">
          Forgot Password?
        </h1>
        <p className="text-gray-500 font-medium leading-relaxed">
          No worries, it happens to the best of us. Enter your email address
          below and we'll send you a 6-digit reset code.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail
              className={`absolute left-3.5 top-3.5 w-5 h-5 transition-colors ${error ? "text-red-400" : "text-gray-400"}`}
            />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${
                error
                  ? "border-red-300 bg-red-50/50 focus:border-red-400"
                  : "border-gray-200 focus:border-[#5B48FC]"
              }`}
            />
          </div>
          {error && (
            <p className="text-xs font-semibold text-red-500 mt-1.5">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !email}
          className={`w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-xl font-bold transition-all ${
            email
              ? "bg-[#5B48FC] text-white hover:bg-[#4A38E0] shadow-md hover:shadow-lg active:scale-[0.98]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            "Sending code..."
          ) : (
            <>
              Send Reset Code <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center lg:text-left pt-6 border-t border-gray-100">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to log in
        </Link>
      </div>
    </div>
  );
}