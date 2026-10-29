"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import SettingsNav from "@/components/settings/SettingsNav";

export default function ProfileSettingsPage() {
  const { refresh } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.user) return;
        setFormData({
          firstName: data.user.firstName ?? "",
          lastName: data.user.lastName ?? "",
          email: data.user.email ?? "",
          phone: data.user.phone ?? "",
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not save your changes");
        return;
      }

      await refresh();
      setSaved(true);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-sans text-[#0F172A]">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Manage your account details and how we contact you.
        </p>
      </header>

      <SettingsNav />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-[#5B48FC]" />
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
          {saved && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-800">
                Profile updated.
              </p>
            </div>
          )}

          <form
            onSubmit={handleSave}
            className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                First name
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm focus:border-[#5B48FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Last name
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm focus:border-[#5B48FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/40"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Email
              <span className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 py-3 pl-10 pr-4 text-sm text-gray-500"
                />
              </span>
              <span className="text-xs font-medium text-gray-500">
                Email changes are not supported yet.
              </span>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Phone number
              <span className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm focus:border-[#5B48FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/40"
                />
              </span>
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B48FC] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#4A38E0] disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </form>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <KeyRound className="h-4 w-4 text-[#5B48FC]" /> Password
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              We email a one-time code to reset your password.
            </p>
            <Link
              href="/auth/forgot-password"
              className="mt-4 inline-flex rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-[#5B48FC]/30 hover:text-[#5B48FC]"
            >
              Change password
            </Link>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <MapPin className="h-4 w-4 text-[#5B48FC]" /> Delivery addresses
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Manage where physical orders are delivered.
            </p>
            <Link
              href="/addresses"
              className="mt-4 inline-flex rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-[#5B48FC]/30 hover:text-[#5B48FC]"
            >
              Manage addresses
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
