"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ShoppingBag,
  MessageSquare,
  Wallet,
  User,
  Bell,
  Search,
  Menu,
} from "lucide-react";

const MOBILE_TABS = [
  { name: "Home", href: "/", icon: Home, label: "Explore" },
  { name: "Order", href: "/order", icon: ShoppingBag, label: "Orders" },
  { name: "Chat", href: "/chat", icon: MessageSquare, label: "Messages" },
  { name: "Wallet", href: "/wallet", icon: Wallet, label: "Wallet" },
  { name: "Profile", href: "/user/profile", icon: User, label: "Profile" },
];

const DESKTOP_LINKS = [
  { name: "Hire Professionals", href: "/handieman" },
  { name: "Shop Products", href: "/products" },
  { name: "All Categories", href: "/categories" },
];

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Active state logic
  const isTabActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F172A] font-sans selection:bg-[#5B48FC] selection:text-white">
      {/* 1. Premium Top Navigation (Desktop & Tablet) */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm/50">
        <div className="flex items-center justify-between h-16 max-w-7xl mx-auto px-4 md:px-8">
          {/* Left: Logo & Main Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-[#5B48FC] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg leading-none">
                  H
                </span>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-[#0F172A]">
                HandieHub
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {DESKTOP_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-[#5B48FC] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Utilities & Auth */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Utility Icons (Hidden on very small screens) */}
            <div className="hidden sm:flex items-center gap-1 mr-2">
              <button className="p-2 text-gray-500 hover:text-[#5B48FC] hover:bg-[#EFEDFF] rounded-full transition-all">
                <Search className="w-5 h-5" />
              </button>
              <button className="relative p-2 text-gray-500 hover:text-[#5B48FC] hover:bg-[#EFEDFF] rounded-full transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>

            {/* Auth Buttons (Desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-gray-700 hover:text-[#5B48FC] px-4 py-2 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-[#5B48FC] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#4A38E0] hover:shadow-md transition-all active:scale-95"
              >
                Join
              </Link>
            </div>

            {/* Mobile Hamburger Menu (Shows instead of auth on mobile) */}
            <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      {/* Added pb-20 on mobile to account for the fixed bottom nav */}
      <main className="flex-1 w-full max-w-7xl mx-auto md:px-4 pb-20 md:pb-8">
        {children}
      </main>

      {/* 2. Mobile Bottom Navigation (App-like feel) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden pb-safe">
        <div className="flex justify-around items-center px-2 h-16">
          {MOBILE_TABS.map((tab) => {
            const isActive = isTabActive(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.name}
                href={tab.href}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(tab.href);
                }}
                className="relative flex flex-col items-center justify-center w-16 h-full gap-1 group"
              >
                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#5B48FC] rounded-b-full"></span>
                )}

                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive
                      ? "text-[#5B48FC] stroke-[2.5px] scale-110"
                      : "text-gray-400 group-hover:text-gray-600 stroke-[2px]"
                  }`}
                />
                <span
                  className={`text-[10px] transition-all duration-200 ${
                    isActive
                      ? "font-bold text-[#5B48FC]"
                      : "font-medium text-gray-500"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
