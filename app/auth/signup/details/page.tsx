"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  seller: "Professional",
  buyer: "Customer",
  handieman: "Professional", // Fallback for legacy links
  user: "Customer", // Fallback for legacy links
};

const COUNTRY_OPTIONS = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
];

export default function SignupDetailsPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<string>("buyer");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "NG",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("accountType");
    if (type && ACCOUNT_TYPE_LABELS[type]) {
      setAccountType(type);
    }
  }, []);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInput = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    let valid = true;

    if (!formData.firstName) {
      newErrors.firstName = "First name required";
      valid = false;
    }
    if (!formData.lastName) {
      newErrors.lastName = "Last name required";
      valid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email required";
      valid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email";
      valid = false;
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number required";
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password required";
      valid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Must be 8+ characters";
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: accountType }),
      });

      if (res.ok) {
        router.push(
          `/auth/verification?email=${encodeURIComponent(formData.email)}`,
        );
      } else {
        const data = await res.json();
        setErrors({
          general: data.error || "Signup failed. Please try again.",
        });
      }
    } catch {
      setErrors({ general: "A network error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormFilled =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.password.length >= 8 &&
    formData.phone;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-2 tracking-tight">
          Create Account
        </h1>
        <p className="text-gray-500 font-medium">
          Join as a{" "}
          <span className="text-[#5B48FC] font-bold">
            {ACCOUNT_TYPE_LABELS[accountType]}
          </span>
        </p>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-800">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
              First Name
            </label>
            <div className="relative">
              <User
                className={`absolute left-3.5 top-3.5 w-5 h-5 transition-colors ${errors.firstName ? "text-red-400" : "text-gray-400"}`}
              />
              <input
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleInput("firstName", e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${errors.firstName ? "border-red-300 bg-red-50/50" : "border-gray-200 focus:border-[#5B48FC]"}`}
              />
            </div>
            {errors.firstName && (
              <p className="text-xs font-semibold text-red-500 mt-1.5">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
              Last Name
            </label>
            <div className="relative">
              <User
                className={`absolute left-3.5 top-3.5 w-5 h-5 transition-colors ${errors.lastName ? "text-red-400" : "text-gray-400"}`}
              />
              <input
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleInput("lastName", e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${errors.lastName ? "border-red-300 bg-red-50/50" : "border-gray-200 focus:border-[#5B48FC]"}`}
              />
            </div>
            {errors.lastName && (
              <p className="text-xs font-semibold text-red-500 mt-1.5">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
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
              className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${errors.email ? "border-red-300 bg-red-50/50" : "border-gray-200 focus:border-[#5B48FC]"}`}
            />
          </div>
          {errors.email && (
            <p className="text-xs font-semibold text-red-500 mt-1.5">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone & Country Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-1">
            <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
              Country
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <select
                value={formData.country}
                onChange={(e) => handleInput("country", e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] shadow-sm appearance-none cursor-pointer"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                className={`absolute left-3.5 top-3.5 w-5 h-5 transition-colors ${errors.phone ? "text-red-400" : "text-gray-400"}`}
              />
              <input
                type="tel"
                placeholder="+234..."
                value={formData.phone}
                onChange={(e) => handleInput("phone", e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${errors.phone ? "border-red-300 bg-red-50/50" : "border-gray-200 focus:border-[#5B48FC]"}`}
              />
            </div>
            {errors.phone && (
              <p className="text-xs font-semibold text-red-500 mt-1.5">
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Password */}
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
              className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 transition-all font-medium text-[#0F172A] bg-gray-50 focus:bg-white shadow-sm ${errors.password ? "border-red-300 bg-red-50/50" : "border-gray-200 focus:border-[#5B48FC]"}`}
            />
          </div>
          {errors.password && (
            <p className="text-xs font-semibold text-red-500 mt-1.5">
              {errors.password}
            </p>
          )}
        </div>

        <div className="pt-2">
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-[#5B48FC] hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#5B48FC] hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>

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
            "Creating account..."
          ) : (
            <>
              Create Account <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
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
