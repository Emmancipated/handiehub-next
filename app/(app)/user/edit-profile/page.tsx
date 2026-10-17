"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, ChevronLeft, Save, Image as ImageIcon } from "lucide-react";

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+234 801 234 5678",
    bio: "I'm a software engineer passionate about building great products.",
    location: "Lagos, Nigeria",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/user/profile"
            className="p-2 rounded-full hover:bg-[#EFEDFF] text-[#131313] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-[#131313]">Edit Profile</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <button className="absolute -bottom-2 -right-2 bg-[#5B48FC] text-white rounded-full p-2 hover:bg-[#4A38E0] transition-colors">
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[#868686]">Change profile picture</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#131313]">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                className="w-full pl-3 pr-4 py-3 rounded-xl border border-[#E8E8E8] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#131313]">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                className="w-full pl-3 pr-4 py-3 rounded-xl border border-[#E8E8E8] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#131313]">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-[#868686]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E8E8] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#131313]">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-[#868686]" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E8E8] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#131313]">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#868686]" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E8E8] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#131313]">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="w-full pl-3 pr-4 py-3 rounded-xl border border-[#E8E8E8] bg-[#F3F3F3] focus:outline-none focus:ring-2 focus:ring-[#5B48FC] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all disabled:opacity-60 bg-[#5B48FC] hover:bg-[#4A38E0]`}
          >
            {isSaving ? <Save className="w-4 h-4 mr-2" /> : ""}Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
