"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    // Mock API call simulation
    setTimeout(() => {
      setIsSubmitting(false);
      setDone(true);
    }, 1000);
  };

  const isFormFilled = password.length >= 8 && confirm.length >= 8;

  // --- Success State UI ---
  if (done) {
    return (
      <div className="w-full text-center lg:text-left animate-fade-in-up">
        <div className="w-16 h-16 bg-[#10B981]/10 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6 border border-[#10B981]/20">
          <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-3 tracking-tight">
          Password Updated
        </h1>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          Your password has been successfully reset. You can now log in to your
          HandieHub account with your new credentials.
        </p>
        <Link
          href="/auth/login"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold bg-[#5B48FC] text-white hover:bg-[#4A38E0] shadow-md transition-all active:scale-[0.98]"
        >
          Return to Login <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // --- Reset Form UI ---
  return (
    <div className="w-full animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-2 tracking-tight">
          Create new password
        </h1>
        <p className="text-gray-500 font-medium">
          Please enter your new password below. Make sure it's at least 8
          characters long.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock
              className={`absolute left-3.5 top-3.5 w-5 h-5 transition-colors ${error && password.length > 0 && password.length < 8 ? "text-red-400" : "text-gray-400"}`}
            />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] shadow-sm"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock
              className={`absolute left-3.5 top-3.5 w-5 h-5 transition-colors ${error && password !== confirm ? "text-red-400" : "text-gray-400"}`}
            />
            <input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError("");
              }}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${
                error && password !== confirm
                  ? "border-red-300 bg-red-50/50"
                  : "border-gray-200 focus:border-[#5B48FC]"
              }`}
            />
          </div>
          {error && (
            <p className="text-xs font-semibold text-red-500 mt-1.5">{error}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isFormFilled}
          className={`w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-xl font-bold transition-all ${
            isFormFilled
              ? "bg-[#5B48FC] text-white hover:bg-[#4A38E0] shadow-md hover:shadow-lg active:scale-[0.98]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            "Updating..."
          ) : (
            <>
              Reset Password <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer / Back Navigation */}
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
