"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Profile", href: "/settings/profile" },
  { label: "Notifications", href: "/settings/notifications" },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-2 rounded-xl border border-gray-200 bg-white p-1.5">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-bold transition-colors ${
            pathname === tab.href
              ? "bg-[#EFEDFF] text-[#5B48FC]"
              : "text-gray-500 hover:text-[#0F172A]"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
