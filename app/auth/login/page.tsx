"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  ShoppingBag,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // "buyer" vs "seller" is clearer terminology for a marketplace than "user/handieman"
  const [choice, setChoice] = useState<"buyer" | "seller">("buyer");
  const [remember, setRemember] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInput = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({ email: "", password: "", general: "" });

    let isValid = true;
    const newErrors = { email: "", password: "", general: "" };

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Passing the chosen role to the backend just in case it's needed for routing/tokens
        body: JSON.stringify({ ...formData, role: choice }),
      });

      if (res.ok) {
        router.push(choice === "seller" ? "/dashboard/seller" : "/");
      } else {
        const data = await res.json();
        setErrors((prev) => ({
          ...prev,
          general: data.error || "Invalid credentials. Please try again.",
        }));
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: "A network error occurred. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormFilled = formData.email && formData.password.length >= 8;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-2 tracking-tight">
          Welcome back
        </h1>
        <p className="text-gray-500 font-medium">
          Sign in to your HandieHub account to continue.
        </p>
      </div>

      {/* General Error Alert */}
      {errors.general && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-800">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role Toggle (Premium segmented control) */}
        <div className="bg-gray-50 p-1 rounded-xl flex items-center mb-6 border border-gray-200">
          <button
            type="button"
            onClick={() => setChoice("buyer")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              choice === "buyer"
                ? "bg-white text-[#0F172A] shadow-sm"
                : "text-gray-500 hover:text-[#0F172A]"
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Customer
          </button>
          <button
            type="button"
            onClick={() => setChoice("seller")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              choice === "seller"
                ? "bg-white text-[#5B48FC] shadow-sm"
                : "text-gray-500 hover:text-[#0F172A]"
            }`}
          >
            <Briefcase className="w-4 h-4" /> Professional
          </button>
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail
              className={`absolute left-3.5 top-3.5 w-5 h-5 transition-colors ${errors.email ? "text-red-400" : "text-gray-400"}`}
            />
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleInput("email", e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${
                errors.email ? "border-red-300 bg-red-50/50" : "border-gray-200"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs font-semibold text-red-500 mt-1.5">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock
              className={`absolute left-3.5 top-3.5 w-5 h-5 transition-colors ${errors.password ? "text-red-400" : "text-gray-400"}`}
            />
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInput("password", e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${
                errors.password
                  ? "border-red-300 bg-red-50/50"
                  : "border-gray-200"
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-xs font-semibold text-red-500 mt-1.5">
              {errors.password}
            </p>
          )}
        </div>

        {/* Options Row */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={remember}
              onChange={() => setRemember(!remember)}
              className="w-4 h-4 rounded border-gray-300 text-[#5B48FC] focus:ring-[#5B48FC] cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-600 group-hover:text-[#0F172A] transition-colors">
              Remember me
            </span>
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-sm font-bold text-[#5B48FC] hover:text-[#4A38E0] transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isFormFilled}
          className={`w-full flex items-center justify-center gap-2 py-3.5 mt-4 rounded-xl font-bold transition-all ${
            isFormFilled
              ? "bg-[#5B48FC] text-white hover:bg-[#4A38E0] shadow-md hover:shadow-lg active:scale-[0.98]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            "Signing in..."
          ) : (
            <>
              Sign in <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center lg:text-left pt-6 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-600">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-bold text-[#5B48FC] hover:underline transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
