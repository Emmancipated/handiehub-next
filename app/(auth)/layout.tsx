"use client";

import Link from "next/link";
import { Sparkles, ShieldCheck, Star } from "lucide-react";

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans selection:bg-[#5B48FC] selection:text-white">
      {/* --- Left Column: Branding & Trust (Hidden on mobile) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0A0A0A] overflow-hidden border-r border-gray-200">
        {/* Ambient Fading Image */}
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2000"
          alt="Professionals at work"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
        />

        {/* Subtle Brand Glow */}
        <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[600px] h-[600px] bg-[#5B48FC]/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent"></div>

        {/* Branding Content */}
        <div className="relative z-10 flex flex-col justify-between w-full h-full p-12 lg:p-16 xl:p-24">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group w-max">
            <div className="w-10 h-10 bg-[#5B48FC] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-[#5B48FC]/20">
              <span className="text-white font-bold text-xl leading-none">
                H
              </span>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              HandieHub
            </span>
          </Link>

          {/* Value Proposition */}
          <div className="max-w-md">
            {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-xs font-bold text-gray-300 mb-6 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#5B48FC]" />
              <span>For Buyers & Professionals</span>
            </div> */}

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] mb-6">
              The premier marketplace for quality goods and expert hands.
            </h1>

            <p className="text-lg text-gray-400 font-medium mb-10">
              Join thousands of users booking verified tradesmen and shopping
              premium materials every day.
            </p>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#5B48FC]/10 border border-[#5B48FC]/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#5B48FC]" />
                </div>
                <span className="text-gray-300 font-bold">
                  Background-checked professionals
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#5B48FC]/10 border border-[#5B48FC]/20 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-[#5B48FC]" />
                </div>
                <span className="text-gray-300 font-bold">
                  Secure payments & verified reviews
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Right Column: The Auth Form (`children`) --- */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Mobile Logo (Only visible on small screens when left side is hidden) */}
        <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-[#5B48FC] rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg leading-none">H</span>
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#0F172A]">
            HandieHub
          </span>
        </Link>

        {/* Form Container */}
        <div className="w-full max-w-md animate-fade-in-up">{children}</div>
      </div>
    </div>
  );
}
