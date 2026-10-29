"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  CalendarCheck,
  ClipboardList,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Star,
  Store,
  UserCog,
  Wallet,
} from "lucide-react";

type DashboardVariant = "customer" | "seller";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
};

const CUSTOMER_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard/customer", icon: LayoutDashboard, exact: true },
  { label: "Orders", href: "/dashboard/customer/orders", icon: Package },
  { label: "Bookings", href: "/dashboard/customer/bookings", icon: CalendarCheck },
  { label: "Saved", href: "/dashboard/customer/saved", icon: Heart },
  { label: "Reviews", href: "/dashboard/customer/reviews", icon: Star },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Settings", href: "/settings/profile", icon: Settings },
];

const SELLER_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard/seller", icon: LayoutDashboard, exact: true },
  { label: "Listings", href: "/dashboard/seller/listings", icon: Store },
  { label: "Orders", href: "/dashboard/seller/orders", icon: ClipboardList },
  { label: "Bookings", href: "/dashboard/seller/bookings", icon: CalendarCheck },
  { label: "Earnings", href: "/dashboard/seller/wallet", icon: BadgeDollarSign },
  { label: "Public profile", href: "/dashboard/seller/public-profile", icon: UserCog },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Settings", href: "/settings/profile", icon: Settings },
];

const COPY = {
  customer: {
    title: "My account",
    subtitle: "Orders, bookings and saved items",
  },
  seller: {
    title: "Seller centre",
    subtitle: "Grow your storefront",
  },
};

export default function DashboardShell({
  variant,
  name,
  children,
}: {
  variant: DashboardVariant;
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = variant === "seller" ? SELLER_NAV : CUSTOMER_NAV;
  const copy = COPY[variant];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-[#0F172A]">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5B48FC] text-lg font-bold leading-none text-white">
                H
              </span>
              <span className="hidden text-lg font-extrabold tracking-tight sm:block">
                HandieHub
              </span>
            </Link>
            <span className="hidden h-6 w-px bg-gray-200 sm:block" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight">{copy.title}</p>
              <p className="text-xs font-medium text-gray-500">{copy.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-[#5B48FC]/30 hover:text-[#5B48FC]"
            >
              Marketplace
            </Link>
            <span className="hidden max-w-[12rem] truncate text-sm font-bold text-gray-700 md:block">
              {name}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-8 md:py-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#EFEDFF] text-[#5B48FC]"
                      : "text-gray-600 hover:bg-white hover:text-[#0F172A]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-16">
          <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#5B48FC] text-white"
                      : "border border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}
