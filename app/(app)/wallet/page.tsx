"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  List,
  ChevronRight,
} from "lucide-react";

const PRIMARY = "#5B48FC";

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const MOCK_TRANSACTIONS = [
  {
    id: "txn_1",
    type: "PAYMENT_CAPTURE",
    direction: "CREDIT" as const,
    amount: 24999,
    status: "SUCCEEDED" as const,
    date: "2024-01-15T10:30:00Z",
    orderNumber: "HH-001",
    description: "Payment for Ambience Black Chair",
  },
  {
    id: "txn_2",
    type: "ESCROW_HOLD",
    direction: "DEBIT" as const,
    amount: 15000,
    status: "SUCCEEDED" as const,
    date: "2024-01-14T14:20:00Z",
    orderNumber: "HH-002",
    description: "Escrow hold for Modern Sofa",
  },
  {
    id: "txn_3",
    type: "ESCROW_RELEASE",
    direction: "CREDIT" as const,
    amount: 14250,
    status: "SUCCEEDED" as const,
    date: "2024-01-13T09:15:00Z",
    orderNumber: "HH-002",
    description: "Escrow release - Modern Sofa",
  },
  {
    id: "txn_4",
    type: "PLATFORM_FEE",
    direction: "DEBIT" as const,
    amount: 750,
    status: "SUCCEEDED" as const,
    date: "2024-01-13T09:15:00Z",
    orderNumber: "HH-002",
    description: "Platform fee (5%)",
  },
];

export default function WalletPage() {
  const [availableBalance, setAvailableBalance] = useState(45250);
  const [escrowBalance, setEscrowBalance] = useState(12000);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#131313] mb-2">Wallet</h1>
            <p className="text-[#868686] text-sm">Manage your Handiehub wallet and transactions</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="#"
              className="px-4 py-2.5 rounded-xl border border-[#E8E8E8] text-[#131313] font-medium hover:bg-[#F3F3F3] transition-colors"
            >
              Add Funds
            </Link>
            <Link
              href="#"
              className="px-4 py-2.5 rounded-xl bg-[#5B48FC] text-white font-medium hover:bg-[#4A38E0] transition-colors"
            >
              Withdraw
            </Link>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#868686]">Available Balance</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#131313]">{formatMoney(availableBalance)}</span>
                </div>
              </div>
              <Wallet className="w-8 h-8 text-[#5B48FC]" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[#F3F3F3]">
              <span className="text-sm text-[#868686]">Withdrawable</span>
              <span className="text-sm font-medium text-[#131313]">{formatMoney(availableBalance)}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#868686]">Escrow Balance</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#131313]">{formatMoney(escrowBalance)}</span>
                </div>
              </div>
              <CreditCard className="w-8 h-8 text-[#5B48FC]" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[#F3F3F3]">
              <span className="text-sm text-[#868686]">Held in escrow</span>
              <span className="text-sm font-medium text-[#131313]">{formatMoney(escrowBalance)}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Send Money", icon: <ArrowUpRight className="w-5 h-5" />, color: "text-[#5B48FC]" },
            { label: "Receive Money", icon: <ArrowDownLeft className="w-5 h-5" />, color: "text-[#10B981]" },
            { label: "Transaction History", icon: <List className="w-5 h-5" />, color: "text-[#868686]" },
            { label: "Bank Transfer", icon: <ChevronRight className="w-5 h-5" />, color: "text-[#868686]" },
          ].map((action, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-[#E8E8E8] hover:border-[#5B48FC] transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EFEDFF] flex items-center justify-center text-[#5B48FC] mb-3">
                {action.icon}
              </div>
              <p className="text-sm font-medium text-[#131313]">{action.label}</p>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] overflow-hidden">
          <div className="p-6 border-b border-[#F3F3F3]">
            <h3 className="font-semibold text-[#131313]">Transaction History</h3>
          </div>
          <div className="divide-y divide-[#F3F3F3]">
            {MOCK_TRANSACTIONS.map((txn) => (
              <div key={txn.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    txn.direction === "CREDIT" ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#EF4444]/10 text-[#EF4444]"
                  }`}>
                    {txn.direction === "CREDIT" ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#131313]">{txn.description}</p>
                    <p className="text-xs text-[#868686]">#{txn.orderNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    txn.direction === "CREDIT" ? "text-[#10B981]" : "text-[#EF4444]"
                  }`}>
                    {txn.direction === "CREDIT" ? "+" : "-"}{formatMoney(txn.amount)}
                  </p>
                  <span className="text-xs text-[#868686] block mt-1">
                    {new Date(txn.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
