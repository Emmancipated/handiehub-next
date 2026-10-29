// @ts-nocheck
import { isSellerProfileComplete } from "@/lib/seller/profile";

const base = {
  businessName: "Fixit Ltd",
  phoneNumber: "+2348000000000",
  country: "NG",
  state: "Lagos",
  city: "Ikeja",
  address: "1 Test Street",
  professions: ["Plumbing"],
  skills: ["Pipe repair"],
};

describe("isSellerProfileComplete", () => {
  it("returns false for a null profile", () => {
    expect(isSellerProfileComplete(null)).toBe(false);
  });

  it("returns true when every required field is present", () => {
    expect(isSellerProfileComplete(base)).toBe(true);
  });

  it("treats blank strings as missing", () => {
    expect(isSellerProfileComplete({ ...base, city: "   " })).toBe(false);
  });

  it("requires at least one profession and skill", () => {
    expect(isSellerProfileComplete({ ...base, professions: [] })).toBe(false);
    expect(isSellerProfileComplete({ ...base, skills: [] })).toBe(false);
  });
});
