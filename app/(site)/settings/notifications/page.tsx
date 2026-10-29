"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Loader2, Mail, MessageSquare, Tag } from "lucide-react";
import SettingsNav from "@/components/settings/SettingsNav";

type Preferences = {
  emailOrderUpdates: boolean;
  emailMessages: boolean;
  emailMarketing: boolean;
  pushEnabled: boolean;
};

const ITEMS: {
  key: keyof Preferences;
  title: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    key: "emailOrderUpdates",
    title: "Order updates",
    description: "Payment, shipping and delivery status by email.",
    icon: Mail,
  },
  {
    key: "emailMessages",
    title: "New messages",
    description: "Get an email when a buyer or seller messages you.",
    icon: MessageSquare,
  },
  {
    key: "emailMarketing",
    title: "Offers and news",
    description: "Occasional product and marketplace announcements.",
    icon: Tag,
  },
  {
    key: "pushEnabled",
    title: "Push notifications",
    description: "Browser alerts on this device (delivery is being rolled out).",
    icon: Bell,
  },
];

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<keyof Preferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings/notifications", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load preferences.");
        setPreferences(data.preferences);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Could not load preferences.");
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const toggle = async (key: keyof Preferences) => {
    if (!preferences) return;
    const next = !preferences[key];
    setPreferences({ ...preferences, [key]: next });
    setSaving(key);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not save your preference.");
      setPreferences(data.preferences);
      setSaved(true);
    } catch (err) {
      setPreferences({ ...preferences, [key]: !next });
      setError(err instanceof Error ? err.message : "Could not save your preference.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-sans text-[#0F172A]">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Choose how HandieHub keeps you informed.
        </p>
      </header>

      <SettingsNav />

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}
      {saved && (
        <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          Preferences saved.
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-[#5B48FC]" />
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const enabled = preferences?.[item.key] ?? false;
            return (
              <li
                key={item.key}
                className="flex items-center gap-4 p-5 sm:gap-5"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EFEDFF] text-[#5B48FC]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">
                    {item.description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={item.title}
                  disabled={saving === item.key}
                  onClick={() => void toggle(item.key)}
                  className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                    enabled ? "bg-[#5B48FC]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-xs font-medium text-gray-500">
        Transactional messages about payments and security are always sent.
      </p>
    </div>
  );
}
