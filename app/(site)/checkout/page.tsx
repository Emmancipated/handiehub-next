"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import {
  CART_CHANGED_EVENT,
  clearCart,
  readCart,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from "@/lib/cart/storage";

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

const formatMoney = (minor: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(minor / 100);

const addressLine = (address: Address) =>
  [address.street, address.city, address.state, address.country]
    .filter(Boolean)
    .join(", ");

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(CART_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);

    const controller = new AbortController();
    Promise.all([
      fetch("/api/auth/me", {
        credentials: "same-origin",
        signal: controller.signal,
      }),
      fetch("/api/addresses", {
        credentials: "same-origin",
        signal: controller.signal,
      }),
    ])
      .then(async ([meRes, addressRes]) => {
        setNeedsLogin(!meRes.ok);
        if (addressRes.ok) {
          const data = await addressRes.json();
          const rows: Address[] = data.addresses ?? [];
          setAddresses(rows);
          setAddressId(rows.find((row) => row.isDefault)?.id ?? rows[0]?.id ?? "");
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setError("Could not prepare checkout.");
      })
      .finally(() => setLoading(false));

    return () => {
      controller.abort();
      window.removeEventListener(CART_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const currency = items[0]?.currency ?? "NGN";
  const subtotal = items.reduce(
    (sum, item) => sum + item.priceMinor * item.quantity,
    0,
  );

  const changeQuantity = (listingId: string, quantity: number) => {
    setItems(updateCartQuantity(listingId, quantity));
  };

  const remove = (listingId: string) => {
    setItems(removeFromCart(listingId));
  };

  const pay = async () => {
    if (items.length === 0) return;
    if (needsLogin) {
      router.push("/auth/login?next=/checkout");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const selected = addresses.find((address) => address.id === addressId);
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            listingId: item.listingId,
            quantity: item.quantity,
          })),
          ...(selected ? { deliveryAddress: selected } : {}),
        }),
      });

      const data = await res.json();
      if (res.status === 401) {
        router.push("/auth/login?next=/checkout");
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Could not create your order.");

      clearCart();
      router.push(`/checkout/payment?orderId=${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your order.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-7 w-7 animate-spin text-[#5B48FC]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 font-sans text-[#0F172A]">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Checkout
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Review your items before paying securely with Paystack.
          </p>
        </header>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag className="h-7 w-7 text-gray-400" />
            </div>
            <h2 className="mb-1 text-lg font-bold">Your cart is empty</h2>
            <p className="mb-5 text-sm font-medium text-gray-500">
              Add a product to get started.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-[#5B48FC] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#4A38E0]"
            >
              Browse products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="space-y-4 lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-1 text-base font-bold">
                  Items from {items[0].sellerName}
                </h2>
                <p className="mb-4 text-xs font-medium text-gray-500">
                  One seller per checkout keeps payments and escrow simple.
                </p>

                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.listingId}
                      className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.slug}`}
                          className="block truncate text-sm font-bold hover:text-[#5B48FC]"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-0.5 text-xs font-medium text-gray-500">
                          {formatMoney(item.priceMinor, item.currency)} each
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                changeQuantity(item.listingId, item.quantity - 1)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40"
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                changeQuantity(item.listingId, item.quantity + 1)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-extrabold">
                              {formatMoney(
                                item.priceMinor * item.quantity,
                                item.currency,
                              )}
                            </span>
                            <button
                              onClick={() => remove(item.listingId)}
                              className="text-gray-400 hover:text-red-500"
                              aria-label={`Remove ${item.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-base font-bold">Delivery address</h2>
                {addresses.length === 0 ? (
                  <p className="text-sm font-medium text-gray-500">
                    No saved addresses.{" "}
                    <Link
                      href="/addresses"
                      className="font-bold text-[#5B48FC] hover:underline"
                    >
                      Add one
                    </Link>{" "}
                    so the seller knows where to deliver.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                          addressId === address.id
                            ? "border-[#5B48FC] bg-[#EFEDFF]/50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={addressId === address.id}
                          onChange={() => setAddressId(address.id)}
                          className="mt-1"
                        />
                        <span>
                          <span className="block text-sm font-bold">
                            {address.label} · {address.fullName}
                          </span>
                          <span className="block text-xs font-medium text-gray-500">
                            {addressLine(address)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="h-max rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <h2 className="mb-4 text-base font-bold">Order summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500">
                    Items ({items.reduce((sum, item) => sum + item.quantity, 0)})
                  </dt>
                  <dd className="font-bold">{formatMoney(subtotal, currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500">Delivery</dt>
                  <dd className="font-bold">Arranged with seller</dd>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
                  <dt className="font-bold">Total</dt>
                  <dd className="font-extrabold">{formatMoney(subtotal, currency)}</dd>
                </div>
              </dl>

              <button
                onClick={() => void pay()}
                disabled={paying}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B48FC] py-3.5 text-sm font-bold text-white hover:bg-[#4A38E0] disabled:opacity-60"
              >
                {paying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {needsLogin ? "Log in to pay" : "Proceed to payment"}
              </button>
              {needsLogin && (
                <p className="mt-2 text-center text-xs font-medium text-gray-500">
                  <Link
                    href="/auth/login?next=/checkout"
                    className="font-bold text-[#5B48FC] hover:underline"
                  >
                    Log in
                  </Link>{" "}
                  to continue.
                </p>
              )}
              <p className="mt-3 text-center text-[11px] font-medium text-gray-400">
                Payments are held in escrow until delivery is confirmed.
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
