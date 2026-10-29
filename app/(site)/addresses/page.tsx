"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  LogIn,
  Star,
  X,
  Map,
  Phone,
  User,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  isDefault: boolean;
};

type AddressForm = {
  label: "home" | "work" | "other";
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
};

const EMPTY_FORM: AddressForm = {
  label: "home",
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  country: "NG",
  postalCode: "",
  isDefault: false,
};

const toForm = (address: Address): AddressForm => ({
  label: ["home", "work", "other"].includes(address.label)
    ? (address.label as AddressForm["label"])
    : "other",
  fullName: address.fullName,
  phone: address.phone,
  street: address.street,
  city: address.city,
  state: address.state ?? "",
  country: address.country,
  postalCode: address.postalCode ?? "",
  isDefault: address.isDefault,
});

const countryLabel = (code: string) =>
  code === "NG" ? "Nigeria" : code === "GH" ? "Ghana" : code;

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAddresses = async (signal?: AbortSignal) => {
    const res = await fetch("/api/addresses", {
      credentials: "same-origin",
      signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        res.status === 401
          ? "Please log in to manage your addresses."
          : (data?.error ?? "Could not load your addresses."),
      );
    }
    return (data.addresses ?? []) as Address[];
  };

  useEffect(() => {
    const controller = new AbortController();

    loadAddresses(controller.signal)
      .then((data) => setAddresses(data))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const openNew = () => {
    setEditingId("new");
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id);
    setForm(toForm(address));
    setFormError(null);
  };

  const closeForm = () => {
    if (saving) return;
    setEditingId(null);
    setFormError(null);
  };

  const setField = <K extends keyof AddressForm>(
    key: K,
    value: AddressForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      ...form,
      state: form.state.trim() || null,
      postalCode: form.postalCode.trim() || null,
    };

    try {
      const res = await fetch(
        editingId === "new" ? "/api/addresses" : `/api/addresses/${editingId}`,
        {
          method: editingId === "new" ? "POST" : "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.issues?.[0]?.message ??
            data?.error ??
            "Could not save this address.",
        );
      }

      setAddresses(await loadAddresses());
      setEditingId(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save this address.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (address: Address) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the "${address.label}" address?`,
      )
    )
      return;
    setDeletingId(address.id);
    try {
      const res = await fetch(`/api/addresses/${address.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Could not delete this address.");
      }
      setAddresses((current) =>
        current.filter((item) => item.id !== address.id),
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Could not delete this address.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const makeDefault = async (address: Address) => {
    if (address.isDefault) return;
    const res = await fetch(`/api/addresses/${address.id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) {
      setAddresses((current) =>
        current.map((item) => ({
          ...item,
          isDefault: item.id === address.id,
        })),
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-24">
      {/* Animation Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `,
        }}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 animate-fade-in-up">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A] mb-2">
              Delivery Addresses
            </h1>
            <p className="text-gray-500 font-medium">
              Manage the locations where your orders will be shipped.
            </p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#5B48FC] text-white font-bold hover:bg-[#4A38E0] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Add Address
          </button>
        </div>

        {/* State Handlers */}
        {loading ? (
          <div
            className="flex flex-col items-center justify-center py-24 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <Loader2 className="w-10 h-10 animate-spin text-[#5B48FC] mb-4" />
            <p className="text-gray-500 font-medium">Loading addresses...</p>
          </div>
        ) : error ? (
          <div
            className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100">
              <MapPin className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-extrabold text-[#0F172A] mb-3">
              {error === "Please log in to manage your addresses."
                ? "Sign in required"
                : "Couldn't load addresses"}
            </h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed max-w-sm mx-auto">
              {error}
            </p>
            {error === "Please log in to manage your addresses." && (
              <Link
                href="/auth/login?next=/addresses"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#5B48FC] text-white font-bold hover:bg-[#4A38E0] shadow-md transition-all active:scale-[0.98]"
              >
                <LogIn className="w-5 h-5" />
                Log in to continue
              </Link>
            )}
          </div>
        ) : addresses.length === 0 ? (
          <div
            className="bg-white/50 rounded-3xl border border-gray-200 border-dashed p-16 text-center animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">
              No addresses yet
            </h3>
            <p className="text-gray-500 font-medium mb-6">
              Add a delivery address so checkout can find you.
            </p>
            <button
              onClick={openNew}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#5B48FC] text-white font-bold hover:bg-[#4A38E0] shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Add your first address
            </button>
          </div>
        ) : (
          /* Address List */
          <div className="space-y-4">
            {addresses.map((address, index) => (
              <div
                key={address.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all duration-300 animate-fade-in-up group hover:shadow-md hover:border-[#5B48FC]/30 ${
                  address.isDefault
                    ? "border-[#5B48FC]/40 shadow-sm"
                    : "border-gray-200"
                }`}
                style={{ animationDelay: `${150 + index * 40}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  {/* Info Section */}
                  <div className="flex gap-4 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        address.isDefault
                          ? "bg-[#EFEDFF] text-[#5B48FC]"
                          : "bg-gray-100 text-gray-500 group-hover:bg-[#EFEDFF] group-hover:text-[#5B48FC]"
                      }`}
                    >
                      <MapPin className="w-6 h-6" />
                    </div>

                    <div className="min-w-0 pt-0.5">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <p className="text-base font-extrabold text-[#0F172A]">
                          {address.fullName}
                        </p>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                          {address.label}
                        </span>
                        {address.isDefault && (
                          <span className="px-2 py-0.5 rounded-md bg-[#10B981]/10 text-[10px] font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1">
                            <Star className="w-3 h-3 fill-[#10B981]" /> Default
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 font-medium leading-relaxed mb-1">
                        {address.street}, {address.city}
                        {address.state ? `, ${address.state}` : ""},{" "}
                        {countryLabel(address.country)}
                        {address.postalCode ? ` ${address.postalCode}` : ""}
                      </p>
                      <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {address.phone}
                      </p>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center sm:flex-col gap-2 sm:gap-1.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                    {!address.isDefault && (
                      <button
                        onClick={() => void makeDefault(address)}
                        title="Set as default"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 bg-gray-50 hover:bg-[#EFEDFF] hover:text-[#5B48FC] transition-colors"
                      >
                        <Star className="w-4 h-4" />{" "}
                        <span className="sm:hidden">Set Default</span>
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(address)}
                      title="Edit address"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 bg-gray-50 hover:bg-[#EFEDFF] hover:text-[#5B48FC] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />{" "}
                      <span className="sm:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => void remove(address)}
                      disabled={deletingId === address.id}
                      title="Delete address"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deletingId === address.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />{" "}
                          <span className="sm:hidden">Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Modal Form --- */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-sm px-4 py-8 overflow-y-auto">
          <form
            onSubmit={submit}
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 my-auto animate-fade-in-up"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-extrabold text-[#0F172A]">
                {editingId === "new" ? "Add New Address" : "Edit Address"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-200 hover:text-[#0F172A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{formError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+234..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Address Label
                </label>
                <select
                  value={form.label}
                  onChange={(e) =>
                    setField("label", e.target.value as AddressForm["label"])
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] shadow-sm appearance-none cursor-pointer"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Street Address
                </label>
                <div className="relative">
                  <Map className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    required
                    value={form.street}
                    onChange={(e) => setField("street", e.target.value)}
                    placeholder="123 Main Street, Apt 4B"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  City
                </label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder="Lagos"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  State
                </label>
                <input
                  value={form.state}
                  onChange={(e) => setField("state", e.target.value)}
                  placeholder="Lagos State"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Country
                </label>
                <select
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] shadow-sm appearance-none cursor-pointer"
                >
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1.5">
                  Postal Code
                </label>
                <input
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  placeholder="100001"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B48FC]/50 focus:border-[#5B48FC] transition-all font-medium text-[#0F172A] shadow-sm"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group w-max">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(e) => setField("isDefault", e.target.checked)}
                      className="peer w-5 h-5 appearance-none rounded border-2 border-gray-300 checked:bg-[#5B48FC] checked:border-[#5B48FC] transition-colors cursor-pointer"
                    />
                    <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-[#0F172A] transition-colors">
                    Set as default delivery address
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#5B48FC] text-white font-bold hover:bg-[#4A38E0] shadow-md transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" /> Save Address
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
