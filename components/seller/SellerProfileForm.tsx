"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { uploadImage } from "@/lib/storage/uploadClient";
import {
  normalizePhone,
  PHONE_COUNTRIES,
  phoneCountry,
  phoneExample,
} from "@/lib/phone";
import {
  DELIVERY_MAX_MINUTES,
  DELIVERY_UNITS,
  DELIVERY_UNIT_LABELS,
  deliveryToMinutes,
  formatDeliveryEstimate,
  minutesToDeliveryForm,
  type DeliveryUnit,
} from "@/lib/seller/delivery";
import {
  RESPONSE_TIME_OPTIONS,
  responseTimeCode,
  type ResponseTime,
} from "@/lib/seller/responseTime";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Upload,
  X,
} from "lucide-react";

const PRIMARY = "#5B48FC";

const COUNTRY_OPTIONS = PHONE_COUNTRIES;

const PROFESSION_SUGGESTIONS = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Cleaning",
  "Tailoring",
  "Photography",
  "Catering",
  "Mechanic",
  "Tiling",
];

type DeliveryForm = {
  min: string;
  max: string;
  unit: DeliveryUnit;
};

type OnboardingForm = {
  businessName: string;
  description: string;
  phoneNumber: string;
  country: string;
  state: string;
  city: string;
  address: string;
  avatarUrl: string;
  professions: string[];
  skills: string[];
  responseTime: ResponseTime | "";
  intraStateDelivery: DeliveryForm;
  interStateDelivery: DeliveryForm;
};

const INITIAL_FORM: OnboardingForm = {
  businessName: "",
  description: "",
  phoneNumber: "",
  country: "NG",
  state: "",
  city: "",
  address: "",
  avatarUrl: "",
  professions: [],
  skills: [],
  responseTime: "",
  intraStateDelivery: { min: "", max: "", unit: "DAYS" },
  interStateDelivery: { min: "", max: "", unit: "DAYS" },
};

const STEPS = ["Business", "Professional", "Delivery"];

export default function SellerProfileForm({
  mode = "onboarding",
}: {
  mode?: "onboarding" | "edit";
}) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(INITIAL_FORM);
  const [professionInput, setProfessionInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // During onboarding, a completed profile skips the wizard. In edit mode we
    // load it so the seller can change their storefront details.
    let active = true;
    fetch("/api/seller/profile", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (data.profile) setHasProfile(true);
        if (data.complete && !isEdit) {
          router.replace("/dashboard/seller");
        } else if (data.profile) {
          const p = data.profile;
          setForm((prev) => ({
            ...prev,
            businessName: p.businessName ?? "",
            description: p.description ?? "",
            phoneNumber: p.phoneNumber ?? "",
            country: p.country ?? "NG",
            state: p.state ?? "",
            city: p.city ?? "",
            address: p.address ?? "",
            avatarUrl: p.avatarUrl ?? "",
            professions: p.professions ?? [],
            skills: p.skills ?? [],
            responseTime: responseTimeCode(p.responseTime) ?? "",
            intraStateDelivery: minutesToDeliveryForm(
              p.intraStateDelivery?.minMinutes,
              p.intraStateDelivery?.maxMinutes,
            ),
            interStateDelivery: minutesToDeliveryForm(
              p.interStateDelivery?.minMinutes,
              p.interStateDelivery?.maxMinutes,
            ),
          }));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, loading, router, isEdit]);

  const update = <K extends keyof OnboardingForm>(
    key: K,
    value: OnboardingForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const addTag = (
    key: "professions" | "skills",
    value: string,
    reset: () => void,
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (form[key].includes(trimmed)) {
      reset();
      return;
    }
    update(key, [...form[key], trimmed]);
    reset();
  };

  const handleAvatar = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file, "avatars");
      update("avatarUrl", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const validateDeliveryRange = (
    range: DeliveryForm,
    label: string,
  ): string | null => {
    const minRaw = range.min.trim();
    const maxRaw = range.max.trim();

    // Both ends are optional; a blank range means "not offered".
    if (!minRaw && !maxRaw) return null;
    if (!minRaw || !maxRaw) {
      return `${label}: enter both a minimum and maximum, or leave both blank.`;
    }

    const min = Number(minRaw);
    const max = Number(maxRaw);

    if (!Number.isInteger(min) || min < 1) {
      return `${label}: minimum must be a whole number greater than 0.`;
    }
    if (!Number.isInteger(max) || max < 1) {
      return `${label}: maximum must be a whole number greater than 0.`;
    }
    if (max < min) {
      return `${label}: maximum must be greater than or equal to the minimum.`;
    }

    const minutes = deliveryToMinutes({ min, max, unit: range.unit });
    if (minutes.maxMinutes > DELIVERY_MAX_MINUTES) {
      return `${label}: the estimate cannot exceed 365 days.`;
    }

    return null;
  };

  const deliveryPreview = (range: DeliveryForm): string | null => {
    if (!range.min.trim() || !range.max.trim()) return null;

    const min = Number(range.min);
    const max = Number(range.max);
    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 1 ||
      max < min
    ) {
      return null;
    }

    const minutes = deliveryToMinutes({ min, max, unit: range.unit });
    if (minutes.maxMinutes > DELIVERY_MAX_MINUTES) return null;

    return formatDeliveryEstimate(minutes.minMinutes, minutes.maxMinutes);
  };

  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!form.businessName.trim()) return "Business name is required";
      if (!form.phoneNumber.trim()) return "Phone number is required";

      const country = phoneCountry(form.country);
      if (!normalizePhone(form.phoneNumber, form.country)) {
        return `Enter a valid phone number for ${country.name}, e.g. ${country.example}.`;
      }

      if (!form.state.trim()) return "State is required";
      if (!form.city.trim()) return "City is required";
      if (!form.address.trim()) return "Address is required";
    }
    if (index === 1) {
      if (form.professions.length === 0)
        return "Select at least one profession";
      if (form.skills.length === 0) return "Add at least one skill";
      if (!form.responseTime) return "Select your typical response time";
    }
    if (index === 2) {
      return (
        validateDeliveryRange(form.intraStateDelivery, "Within your state") ??
        validateDeliveryRange(form.interStateDelivery, "To other states")
      );
    }
    return null;
  };

  const deliveryPayload = (range: DeliveryForm) => {
    const min = range.min.trim();
    const max = range.max.trim();
    if (!min && !max) return null;

    return {
      min: Number(min),
      max: Number(max),
      unit: range.unit,
    };
  };

  const payloadForSteps = (uptoIndex: number) => {
    const payload: Record<string, unknown> = {};
    if (uptoIndex >= 0) {
      payload.businessName = form.businessName;
      payload.description = form.description || undefined;
      payload.phoneNumber =
        normalizePhone(form.phoneNumber, form.country) ?? form.phoneNumber;
      payload.country = form.country;
      payload.state = form.state;
      payload.city = form.city;
      payload.address = form.address;
      payload.professions = form.professions;
      payload.skills = form.skills;
      payload.responseTime = form.responseTime || undefined;
      if (form.avatarUrl) payload.avatarUrl = form.avatarUrl;
    }
    if (uptoIndex >= 2) {
      payload.intraStateDelivery = deliveryPayload(form.intraStateDelivery);
      payload.interStateDelivery = deliveryPayload(form.interStateDelivery);
    }
    return payload;
  };

  const persist = async (isFirstStep: boolean, uptoIndex: number) => {
    const res = await fetch("/api/seller/profile", {
      method: isFirstStep ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payloadForSteps(uptoIndex)),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Could not save your profile");
    }
    return res.json();
  };

  const handleNext = async () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      await persist(!hasProfile && step === 0, step);
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else if (isEdit) {
        setSaved(true);
      } else {
        // Onboarding grants the SELLER role; refresh so the shell shows the
        // seller navigation immediately.
        await refresh();
        router.push("/dashboard/seller");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#5B48FC]" />
      </div>
    );
  }

  return (
    <div className={isEdit ? "" : "min-h-screen bg-[#F8FAFC] pb-24"}>
      <div className={isEdit ? "" : "max-w-2xl mx-auto px-4 py-10"}>
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight md:text-3xl">
            {isEdit ? "Edit your public profile" : "Set up your seller profile"}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {isEdit
              ? "Update the details buyers see on your storefront."
              : "Publish listings after completing these three quick steps."}
          </p>
        </div>

        {saved && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-800">
              Your public profile has been updated.
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, index) => (
            <div key={label} className="flex-1">
              <div
                className="h-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: index <= step ? PRIMARY : "#E2E8F0",
                }}
              />
              <p
                className={`text-xs font-bold mt-2 ${
                  index <= step ? "text-[#0F172A]" : "text-gray-400"
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-5">
          {step === 0 && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFEDFF] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#5B48FC]" />
                </div>
                <h2 className="text-lg font-bold text-[#0F172A]">
                  Business details
                </h2>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Business name
                </label>
                <input
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  placeholder="e.g. Ambience Furniture Ltd"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  About your business
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                  placeholder="Tell customers what you offer"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={32}
                    value={form.phoneNumber}
                    onChange={(e) => update("phoneNumber", e.target.value)}
                    onBlur={() => {
                      const normalized = normalizePhone(
                        form.phoneNumber,
                        form.country,
                      );
                      if (normalized) update("phoneNumber", normalized);
                    }}
                    placeholder={phoneExample(form.country)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                  />
                  <p className="mt-1.5 text-xs font-medium text-gray-500">
                    Include the country code, or enter a local number for the
                    selected country. We save it in international format.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                    Country
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                    State
                  </label>
                  <input
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                    placeholder="Lagos"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                    City
                  </label>
                  <input
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="Ikeja"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="Street address"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Profile photo
                </label>
                <div className="flex items-center gap-4">
                  {form.avatarUrl ? (
                    <img
                      src={form.avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#0F172A] hover:bg-gray-50">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {form.avatarUrl ? "Replace photo" : "Upload photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAvatar(e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Professional details
              </h2>

              <TagEditor
                label="Professions"
                placeholder="Add a profession and press Enter"
                value={professionInput}
                onChange={setProfessionInput}
                onAdd={() =>
                  addTag("professions", professionInput, () =>
                    setProfessionInput(""),
                  )
                }
                tags={form.professions}
                onRemove={(tag) =>
                  update(
                    "professions",
                    form.professions.filter((p) => p !== tag),
                  )
                }
                suggestions={PROFESSION_SUGGESTIONS}
                onSuggestion={(s) =>
                  update("professions", [...new Set([...form.professions, s])])
                }
              />

              <TagEditor
                label="Skills"
                placeholder="Add a skill and press Enter"
                value={skillInput}
                onChange={setSkillInput}
                onAdd={() =>
                  addTag("skills", skillInput, () => setSkillInput(""))
                }
                tags={form.skills}
                onRemove={(tag) =>
                  update(
                    "skills",
                    form.skills.filter((s) => s !== tag),
                  )
                }
              />

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Typical response time
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <select
                    value={form.responseTime}
                    onChange={(e) =>
                      update("responseTime", e.target.value as ResponseTime | "")
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                  >
                    <option value="">Select a response time</option>
                    {RESPONSE_TIME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1.5 text-xs font-medium text-gray-500">
                  Customers see this on your profile. Pick the standard range
                  that best matches how quickly you usually reply.
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Delivery estimates
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Choose minutes, hours, or days for each range. Leave a range
                blank if it does not apply to your business.
              </p>
              <div className="space-y-4">
                {(
                  [
                    {
                      key: "intraStateDelivery",
                      title: "Within your state",
                      hint: "How long delivery usually takes inside your state.",
                    },
                    {
                      key: "interStateDelivery",
                      title: "To other states",
                      hint: "How long delivery usually takes to another state.",
                    },
                  ] as const
                ).map(({ key, title, hint }) => {
                  const range = form[key];
                  const preview = deliveryPreview(range);

                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-gray-200 bg-gray-50/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-[#0F172A]">{title}</h3>
                        <span
                          className={`text-xs font-bold ${
                            preview ? "text-[#5B48FC]" : "text-gray-400"
                          }`}
                        >
                          {preview
                            ? `Customers see: ${preview}`
                            : "Optional"}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-500 mb-3">
                        {hint}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <label className="block text-xs font-bold text-gray-500">
                          Minimum
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={range.min}
                            onChange={(e) =>
                              update(key, { ...range, min: e.target.value })
                            }
                            placeholder="1"
                            className="mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                          />
                        </label>
                        <label className="block text-xs font-bold text-gray-500">
                          Maximum
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={range.max}
                            onChange={(e) =>
                              update(key, { ...range, max: e.target.value })
                            }
                            placeholder="2"
                            className="mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                          />
                        </label>
                        <label className="col-span-2 sm:col-span-1 block text-xs font-bold text-gray-500">
                          Unit
                          <select
                            value={range.unit}
                            onChange={(e) =>
                              update(key, {
                                ...range,
                                unit: e.target.value as DeliveryUnit,
                              })
                            }
                            className="mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
                          >
                            {DELIVERY_UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {DELIVERY_UNIT_LABELS[unit]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || saving}
              className="text-sm font-bold text-gray-500 hover:text-[#0F172A] disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: PRIMARY }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === STEPS.length - 1 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {step === STEPS.length - 1
                ? isEdit
                  ? "Save changes"
                  : "Finish setup"
                : "Save & continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TagEditor({
  label,
  placeholder,
  value,
  onChange,
  onAdd,
  tags,
  onRemove,
  suggestions,
  onSuggestion,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  tags: string[];
  onRemove: (tag: string) => void;
  suggestions?: string[];
  onSuggestion?: (tag: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] font-medium text-[#0F172A]"
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-4 rounded-xl border border-gray-200 font-bold text-[#0F172A] hover:bg-gray-50"
        >
          Add
        </button>
      </div>

      {suggestions && onSuggestion && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestions
            .filter((s) => !tags.includes(s))
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion(s)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#EFEDFF] text-[#5B48FC] hover:bg-[#5B48FC] hover:text-white transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm font-semibold text-[#0F172A]"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
