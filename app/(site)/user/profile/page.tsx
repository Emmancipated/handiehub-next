"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Edit3,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  Briefcase,
  Loader2,
  LogOut,
  Star,
} from "lucide-react";

type ProfileUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roles: string[];
  emailVerified: boolean;
  createdAt: string;
};

type Stats = {
  orders: number;
  completedOrders: number;
  reviewsWritten: number;
};

type OrderRow = {
  id: string;
  orderNumber?: string;
  status: string;
  totalMinor: string;
  currency?: string;
  createdAt: string;
};

function formatMoney(minor: string, currency = "NGN") {
  const value = Number(minor) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function UserProfilePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace("/auth/login");
      return;
    }

    let active = true;
    Promise.all([
      fetch("/api/auth/me", { credentials: "same-origin" }).then((res) =>
        res.ok ? res.json() : null,
      ),
      fetch("/api/users/me/stats", { credentials: "same-origin" }).then(
        (res) => (res.ok ? res.json() : null),
      ),
      fetch("/api/orders/my-orders?limit=3", {
        credentials: "same-origin",
      }).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([meData, statsData, ordersData]) => {
        if (!active) return;
        if (meData?.user) setUser(meData.user);
        if (statsData?.stats) setStats(statsData.stats);
        if (ordersData?.orders) setOrders(ordersData.orders);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authUser, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5B48FC] mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!user) return null;

  const isSeller = user.roles.includes("SELLER");
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

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

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* --- Left Column: Profile Card & Settings --- */}
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="animate-fade-in-up bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-[#5B48FC]/10 to-[#5B48FC]/5"></div>
              <div className="px-6 pb-6 relative -mt-16 text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-white flex items-center justify-center border-4 border-white shadow-md mb-4">
                  <div className="w-full h-full rounded-full bg-[#EFEDFF] flex items-center justify-center text-[#5B48FC]">
                    <User className="w-12 h-12" />
                  </div>
                </div>

                <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-1">
                  {fullName}
                </h2>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    {isSeller ? "Professional" : "Customer"}
                  </span>
                  {user.emailVerified && (
                    <span className="flex items-center gap-1 bg-[#10B981]/10 px-2 py-0.5 rounded text-[#10B981] text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 font-medium mb-6">
                  Member since {formatDate(user.createdAt)}
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/settings/profile"
                    className="w-full py-3 rounded-xl border-2 border-gray-100 text-gray-700 font-bold hover:border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </Link>
                  {isSeller && (
                    <Link
                      href="/dashboard/seller"
                      className="w-full py-3 rounded-xl bg-[#0F172A] text-white font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                    >
                      <Briefcase className="w-4 h-4" /> Seller Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div
              className="animate-fade-in-up bg-white rounded-3xl shadow-sm border border-gray-200 p-6"
              style={{ animationDelay: "100ms" }}
            >
              <h3 className="font-bold text-[#0F172A] mb-4">
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Email Address
                    </p>
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Phone Number
                    </p>
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {user.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions / Settings */}
            <div
              className="animate-fade-in-up space-y-2"
              style={{ animationDelay: "150ms" }}
            >
              {[
                {
                  icon: <Bell className="w-5 h-5" />,
                  label: "Notifications",
                  href: "/notifications",
                },
                {
                  icon: <MapPin className="w-5 h-5" />,
                  label: "Delivery Addresses",
                  href: "/addresses",
                },
                // {
                //   icon: <Lock className="w-5 h-5" />,
                //   label: "Security & Passwords",
                //   href: "/settings/security",
                // },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between w-full p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#5B48FC]/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#5B48FC]">
                    {item.icon}
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#5B48FC]" />
                </Link>
              ))}

              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
                className="flex items-center gap-3 w-full p-4 mt-4 bg-red-50 rounded-2xl border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all text-red-600 font-bold text-sm text-left"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </div>

          {/* --- Right Column: Stats & Activity --- */}
          <div className="lg:col-span-8 space-y-6">
            {/* Account Overview Stats */}
            <div
              className="animate-fade-in-up bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8"
              style={{ animationDelay: "200ms" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-xl text-[#0F172A]">
                  Account Overview
                </h3>
                <Link
                  href="/dashboard/customer"
                  className="hidden sm:flex items-center text-sm font-bold text-[#5B48FC] hover:text-[#4A38E0]"
                >
                  View Dashboard <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#5B48FC] mb-3">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Total Orders
                  </p>
                  <p className="text-3xl font-extrabold text-[#0F172A]">
                    {stats?.orders ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-green-500 mb-3">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Completed
                  </p>
                  <p className="text-3xl font-extrabold text-[#0F172A]">
                    {stats?.completedOrders ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 col-span-2 md:col-span-1">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-yellow-500 mb-3">
                    <Star className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Reviews
                  </p>
                  <p className="text-3xl font-extrabold text-[#0F172A]">
                    {stats?.reviewsWritten ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Orders List */}
            <div
              className="animate-fade-in-up bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden"
              style={{ animationDelay: "250ms" }}
            >
              <div className="p-6 sm:p-8 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-extrabold text-xl text-[#0F172A]">
                  Recent Activity
                </h3>
                <Link
                  href="/dashboard/customer/orders"
                  className="text-sm font-bold text-[#5B48FC] hover:text-[#4A38E0] transition-colors"
                >
                  View All
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-base font-bold text-[#0F172A] mb-1">
                    No recent activity
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    When you book services or buy items, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#EFEDFF] border border-[#5B48FC]/20 flex items-center justify-center text-[#5B48FC] flex-shrink-0">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-[#0F172A] mb-0.5">
                            Order #
                            {order.orderNumber ??
                              order.id.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-sm font-medium text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-1.5 pl-16 sm:pl-0">
                        <p className="text-lg font-extrabold text-[#0F172A]">
                          {formatMoney(order.totalMinor, order.currency)}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                            order.status.toLowerCase() === "completed"
                              ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
