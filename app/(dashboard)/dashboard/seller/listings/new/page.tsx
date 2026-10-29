"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { uploadImage } from "@/lib/storage/uploadClient";
import {
  AlertTriangle,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";

const PRIMARY = "#5B48FC";

type Category = {
  id: string;
  name: string;
  slug: string;
  children?: { id: string; name: string; slug: string }[];
};

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  kind: "PRODUCT" | "SERVICE";
  price: string;
  stockOnHand: string;
  serviceDurationMins: string;
  serviceArea: string;
  images: string[];
};

const INITIAL: FormState = {
  title: "",
  description: "",
  categoryId: "",
  kind: "PRODUCT",
  price: "",
  stockOnHand: "",
  serviceDurationMins: "",
  serviceArea: "",
  images: [],
};

export default function NewListingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    fetch("/api/listings/categories?limit=100", {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, [user, loading, router]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleImages = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, 6)) {
        uploaded.push(await uploadImage(file, "listings"));
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsOnboarding(false);

    if (!form.title.trim()) return setError("Title is required");
    if (!form.description.trim()) return setError("Description is required");
    if (!form.categoryId) return setError("Choose a category");
    if (!form.price || Number(form.price) <= 0)
      return setError("Enter a valid price");

    setSaving(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          kind: form.kind,
          priceMinor: String(Math.round(Number(form.price) * 100)),
          currency: "NGN",
          images: form.images,
          ...(form.kind === "PRODUCT"
            ? form.stockOnHand
              ? { stockOnHand: Number(form.stockOnHand) }
              : {}
            : {
                ...(form.serviceDurationMins
                  ? { serviceDurationMins: Number(form.serviceDurationMins) }
                  : {}),
                ...(form.serviceArea ? { serviceArea: form.serviceArea } : {}),
              }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "SELLER_PROFILE_INCOMPLETE") {
          setNeedsOnboarding(true);
        }
        setError(data.error || "Could not create the listing");
        return;
      }

      router.push("/dashboard/seller");
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#5B48FC]" />
      </div>
    );
  }

  return (
    <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight md:text-3xl mb-1">
          Create a listing
        </h1>
        <p className="text-gray-500 font-medium mb-8">
          New listings start as drafts. Publish when you&apos;re ready.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
              {needsOnboarding && (
                <Link
                  href="/seller/onboarding"
                  className="text-sm font-bold text-[#5B48FC] hover:underline mt-1 inline-block"
                >
                  Complete your seller profile →
                </Link>
              )}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
              Title
            </label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={180}
              placeholder="e.g. Custom wooden dining table"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              placeholder="Describe what you're offering"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                Type
              </label>
              <select
                value={form.kind}
                onChange={(e) =>
                  update("kind", e.target.value as "PRODUCT" | "SERVICE")
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
              >
                <option value="PRODUCT">Product</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                Category
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => update("categoryId", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <optgroup key={category.id} label={category.name}>
                    <option value={category.id}>
                      {category.name} (general)
                    </option>
                    {(category.children ?? []).map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                Price (₦)
              </label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
              />
            </div>

            {form.kind === "PRODUCT" ? (
              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Stock on hand
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.stockOnHand}
                  onChange={(e) => update("stockOnHand", e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.serviceDurationMins}
                  onChange={(e) =>
                    update("serviceDurationMins", e.target.value)
                  }
                  placeholder="Optional"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                />
              </div>
            )}
          </div>

          {form.kind === "SERVICE" && (
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                Service area
              </label>
              <input
                value={form.serviceArea}
                onChange={(e) => update("serviceArea", e.target.value)}
                placeholder="e.g. Lagos mainland"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
              Images
            </label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((url) => (
                <div key={url} className="relative w-20 h-20">
                  <img
                    src={url}
                    alt="Listing"
                    className="w-full h-full object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "images",
                        form.images.filter((image) => image !== url),
                      )
                    }
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-[#5B48FC] hover:text-[#5B48FC] transition-colors">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-1">Add</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImages(e.target.files)}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/seller"
              className="px-5 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-md disabled:opacity-60"
              style={{ backgroundColor: PRIMARY }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create draft
            </button>
          </div>
        </form>
    </div>
  );
}
