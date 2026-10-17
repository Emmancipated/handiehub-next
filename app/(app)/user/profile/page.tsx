"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Settings,
  Edit3,
  ShieldCheck,
  Star,
  LogOut,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";

const PRIMARY = "#5B48FC";

export default function UserProfilePage() {
  const [user, setUser] = useState({
    id: "user_1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+234 801 234 5678",
    roles: ["CUSTOMER"],
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    memberSince: "January 2024",
  });
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  {isEditing && (
                    <button className="absolute -bottom-2 -right-2 bg-[#5B48FC] text-white rounded-full p-2 hover:bg-[#4A38E0] transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-[#131313] mt-4">
                  {user.firstName} {user.lastName}
                </h2>
                <span className="text-sm text-[#868686]">
                  {user.roles.join(", ").toLowerCase()}
                </span>
                {user.emailVerified && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-semibold">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                <p className="text-xs text-[#868686] mt-2">
                  Member since {user.memberSince}
                </p>
              </div>

              <div className="space-y-4">
                {[  
                  { icon: <Mail className="w-5 h-5" />, label: "Email", value: user.email },
                  { icon: <Phone className="w-5 h-5" />, label: "Phone", value: user.phone },
                  { icon: <MapPin className="w-5 h-5" />, label: "Location", value: "Lagos, Nigeria" },
                ].map((field, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-[#F3F3F3] last:border-0">
                    <div className="w-10 h-10 rounded-lg bg-[#EFEDFF] flex items-center justify-center text-[#5B48FC]">
                      {field.icon}
                    </div>
                    <div>
                      <p className="text-xs text-[#868686]">{field.label}</p>
                      <p className="text-sm text-[#131313] font-medium">{field.value}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#E8E8E8]" />
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 rounded-xl border border-[#E8E8E8] text-[#131313] font-medium hover:bg-[#F3F3F3] transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
              <h3 className="font-semibold text-[#131313] mb-4">Account Settings</h3>
              <div className="space-y-0">
                <button
                  onClick={() => {}}
                  className="flex items-center justify-between w-full py-4 border-b border-[#F3F3F3] last:border-0 hover:bg-[#F3F3F3] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-[#5B48FC]" />
                    <span className="text-sm text-[#131313]">Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#E8E8E8]" />
                </button>
                <button
                  onClick={() => {}}
                  className="flex items-center justify-between w-full py-4 border-b border-[#F3F3F3] last:border-0 hover:bg-[#F3F3F3] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#5B48FC]" />
                    <span className="text-sm text-[#131313]">Notifications</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#E8E8E8]" />
                </button>
                <button
                  onClick={() => {}}
                  className="flex items-center justify-between w-full py-4 border-b border-[#F3F3F3] last:border-0 hover:bg-[#F3F3F3] transition-colors text-red-500"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-[#EF4444]" />
                    <span className="text-sm text-[#131313]">Sign Out</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:w-2/3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
              <h3 className="font-semibold text-[#131313] mb-6">Account Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#F3F3F3] rounded-xl p-4">
                  <p className="text-xs text-[#868686] uppercase font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-[#131313] mt-1">12</p>
                </div>
                <div className="bg-[#F3F3F3] rounded-xl p-4">
                  <p className="text-xs text-[#868686] uppercase font-medium">Completed</p>
                  <p className="text-2xl font-bold text-[#131313] mt-1">10</p>
                </div>
                <div className="bg-[#F3F3F3] rounded-xl p-4">
                  <p className="text-xs text-[#868686] uppercase font-medium">Reviews</p>
                  <p className="text-2xl font-bold text-[#131313] mt-1">3</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-[#131313]">Recent Activity</h3>
                <Link
                  href="/order"
                  className="text-sm text-[#5B48FC] font-medium hover:underline"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  {
                    title: "Order #HH-001 delivered",
                    time: "2 hours ago",
                    status: "Delivered",
                    amount: "₦24,999",
                  },
                  {
                    title: "Order #HH-002 confirmed",
                    time: "1 day ago",
                    status: "Paid",
                    amount: "₦89,999",
                  },
                  {
                    title: "Order #HH-003 cancelled",
                    time: "3 days ago",
                    status: "Cancelled",
                    amount: "₦12,500",
                  },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-[#F3F3F3] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#EFEDFF] flex items-center justify-center text-[#5B48FC]">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-[#131313] font-medium">{activity.title}</p>
                        <p className="text-xs text-[#868686]">{activity.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#131313]">{activity.amount}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        activity.status === "Delivered" ? "bg-[#10B981]/10 text-[#10B981]" :
                        activity.status === "Paid" ? "bg-[#5B48FC]/10 text-[#5B48FC]" :
                        "bg-[#EF4444]/10 text-[#EF4444]"
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
