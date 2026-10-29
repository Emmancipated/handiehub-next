import {
  normalizePhone,
  phoneCountry,
  phoneExample,
} from "@/lib/phone";

describe("normalizePhone", () => {
  it("converts a local Nigerian number to E.164", () => {
    expect(normalizePhone("0801 234 5678", "NG")).toBe("+2348012345678");
  });

  it("accepts international numbers regardless of the selected country", () => {
    expect(normalizePhone("+233 24 123 4567", "NG")).toBe("+233241234567");
  });

  it("converts a 00 international prefix to +", () => {
    expect(normalizePhone("002348012345678", "NG")).toBe("+2348012345678");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizePhone("  +234 801 234 5678  ", "NG")).toBe(
      "+2348012345678",
    );
  });

  it("rejects invalid or empty values", () => {
    expect(normalizePhone("", "NG")).toBeNull();
    expect(normalizePhone("abc", "NG")).toBeNull();
    expect(normalizePhone("123", "NG")).toBeNull();
  });

  it("falls back to the default country for unknown region codes", () => {
    expect(normalizePhone("0801 234 5678", "XX")).toBe("+2348012345678");
  });
});

describe("phone helpers", () => {
  it("returns the country name and example", () => {
    expect(phoneCountry("GH").name).toBe("Ghana");
    expect(phoneExample("GH")).toBe("+233 24 123 4567");
  });

  it("falls back to Nigeria for unknown countries", () => {
    expect(phoneCountry("XX").code).toBe("NG");
  });
});
