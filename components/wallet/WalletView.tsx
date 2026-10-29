"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  List,
  ChevronRight,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Package,
  PlusCircle,
} from "lucide-react";

type LedgerEntry = {
  id: string;
  kind:
    | "PAYMENT_CAPTURE"
    | "ESCROW_HOLD"
    | "ESCROW_RELEASE"
    | "REFUND"
    | "PLATFORM_FEE"
    | "PAYOUT"
    | "ADJUSTMENT";
  direction: "CREDIT" | "DEBIT";
  amountMinor: string;
  currency: string;
  createdAt: string;
  order: { id: string; orderNumber: string; status: string } | null;
};

type Balance = {
  availableBalance: string;
  escrowBalance: string;
  currency: string;
};

const KIND_LABELS: Record<LedgerEntry["kind"], string> = {
  PAYMENT_CAPTURE: "Payment captured",
  ESCROW_HOLD: "Funds held in escrow",
  ESCROW_RELEASE: "Escrow released",
  REFUND: "Refund",
  PLATFORM_FEE: "Platform fee",
  PAYOUT: "Payout",
  ADJUSTMENT: "Adjustment",
};

const formatMoney = (minor: string | number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(minor) / 100);

export default function WalletView({
  variant = "customer",
}: {
  variant?: "customer" | "seller";
}) {
  const isSeller = variant === "seller";
  const ordersHref = isSeller
    ? "/dashboard/seller/orders"
    : "/dashboard/customer/orders";
  const title = isSeller ? "Earnings" : "Wallet";
  const subtitle = isSeller
    ? "Available balance, escrow and payouts."
    : "Manage your HandieHub balance and transactions";
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "CREDIT" | "DEBIT">("all");

  useEffect(() => {
    const controller = new AbortController();

    const get = async (url: string) => {
      const res = await fetch(url, {
        credentials: "same-origin",
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "Please log in to view your wallet."
            : (data?.error ?? "Could not load your wallet."),
        );
      }
      return data;
    };

    Promise.all([
      get("/api/wallet/balance"),
      get("/api/wallet/transactions?limit=50"),
    ])
      .then(([balanceData, transactionsData]) => {
        setBalance({
          availableBalance: balanceData.availableBalance,
          escrowBalance: balanceData.escrowBalance,
          currency: balanceData.currency ?? "NGN",
        });
        setTransactions(transactionsData.transactions ?? []);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const visibleTransactions = transactions.filter(
    (transaction) => filter === "all" || transaction.direction === filter,
  );

  const quickActions = isSeller
    ? [
        {
          label: "My Orders",
          href: ordersHref,
          icon: <Package className="w-5 h-5" />,
        },
        {
          label: "My Listings",
          href: "/dashboard/seller/listings",
          icon: <PlusCircle className="w-5 h-5" />,
        },
        {
          label: "Seller Dashboard",
          href: "/dashboard/seller",
          icon: <ShieldCheck className="w-5 h-5" />,
        },
      ]
    : [
        {
          label: "Browse Products",
          href: "/products",
          icon: <ShoppingBag className="w-5 h-5" />,
        },
        {
          label: "My Orders",
          href: ordersHref,
          icon: <Package className="w-5 h-5" />,
        },
        {
          label: "Messages",
          href: "/messages",
          icon: <PlusCircle className="w-5 h-5" />,
        },
      ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#131313] mb-2">{title}</h1>
            <p className="text-[#868686] text-sm">
              {subtitle}
            </p>
          </div>
          <Link
            href={ordersHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E8E8] bg-white text-[#131313] font-medium hover:border-[#5B48FC] hover:text-[#5B48FC] transition-colors"
          >
            <List className="w-4 h-4" />
            My Orders
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#868686]">
            <Loader2 className="w-6 h-6 animate-spin mr-3 text-[#5B48FC]" />
            Loading wallet…
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-[#E8E8E8] p-10 text-center">
            <Wallet className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <h2 className="text-lg font-bold text-[#131313] mb-2">
              {error === "Please log in to view your wallet."
                ? "Log in to view your wallet"
                : "Could not load your wallet"}
            </h2>
            <p className="text-sm text-[#868686] mb-5">{error}</p>
            <Link
              href="/auth/login?next=/wallet"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#5B48FC] text-white font-semibold hover:bg-[#4A38E0] transition-colors"
            >
              Log in
            </Link>
          </div>
        ) : (
          <>
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-[#868686]">Available Balance</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[#131313]">
                        {formatMoney(
                          balance?.availableBalance ?? "0",
                          balance?.currency,
                        )}
                      </span>
                    </div>
                  </div>
                  <Wallet className="w-8 h-8 text-[#5B48FC]" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[#F3F3F3]">
                  <span className="text-sm text-[#868686]">Withdrawable</span>
                  <span className="text-sm font-medium text-[#131313]">
                    {formatMoney(
                      balance?.availableBalance ?? "0",
                      balance?.currency,
                    )}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-[#868686]">Escrow Balance</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[#131313]">
                        {formatMoney(
                          balance?.escrowBalance ?? "0",
                          balance?.currency,
                        )}
                      </span>
                    </div>
                  </div>
                  <CreditCard className="w-8 h-8 text-[#5B48FC]" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[#F3F3F3]">
                  <span className="text-sm text-[#868686]">Held in escrow</span>
                  <span className="text-sm font-medium text-[#131313]">
                    {formatMoney(
                      balance?.escrowBalance ?? "0",
                      balance?.currency,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="bg-white rounded-xl p-4 border border-[#E8E8E8] hover:border-[#5B48FC] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#EFEDFF] flex items-center justify-center text-[#5B48FC] mb-3 group-hover:bg-[#5B48FC] group-hover:text-white transition-colors">
                    {action.icon}
                  </div>
                  <p className="text-sm font-medium text-[#131313]">
                    {action.label}
                  </p>
                </Link>
              ))}
            </div>

            {/* Transaction History */}
            <div
              id="transactions"
              className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] overflow-hidden"
            >
              <div className="p-6 border-b border-[#F3F3F3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-semibold text-[#131313]">
                  Transaction History
                </h3>
                <div className="flex items-center gap-1 bg-[#F3F3F3] rounded-lg p-1">
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "CREDIT", label: "Credits" },
                      { id: "DEBIT", label: "Debits" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        filter === tab.id
                          ? "bg-white text-[#131313] shadow-sm"
                          : "text-[#868686] hover:text-[#131313]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {visibleTransactions.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#868686]">
                  No transactions yet. Payments and escrow movements will appear
                  here.
                </div>
              ) : (
                <div className="divide-y divide-[#F3F3F3]">
                  {visibleTransactions.map((txn) => {
                    const credit = txn.direction === "CREDIT";
                    return (
                      <div
                        key={txn.id}
                        className="p-5 sm:p-6 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              credit
                                ? "bg-[#10B981]/10 text-[#10B981]"
                                : "bg-[#EF4444]/10 text-[#EF4444]"
                            }`}
                          >
                            {credit ? (
                              <ArrowDownLeft className="w-5 h-5" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#131313] truncate">
                              {KIND_LABELS[txn.kind] ?? txn.kind}
                            </p>
                            <p className="text-xs text-[#868686]">
                              {txn.order?.orderNumber
                                ? `#${txn.order.orderNumber}`
                                : new Date(txn.createdAt).toLocaleDateString(
                                    "en-NG",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`text-sm font-semibold ${
                              credit ? "text-[#10B981]" : "text-[#EF4444]"
                            }`}
                          >
                            {credit ? "+" : "−"}
                            {formatMoney(txn.amountMinor, txn.currency)}
                          </p>
                          <span className="text-xs text-[#868686] block mt-1">
                            {new Date(txn.createdAt).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {balance?.escrowBalance && balance.escrowBalance !== "0" && (
              <Link
                href={ordersHref}
                className="mt-6 flex items-center justify-between bg-white rounded-xl border border-[#E8E8E8] p-4 hover:border-[#5B48FC] transition-colors"
              >
                <span className="text-sm text-[#868686]">
                  Looking for escrow releases?
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-[#5B48FC]">
                  View orders <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
