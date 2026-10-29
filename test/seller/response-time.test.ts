import {
  responseTimeCode,
  responseTimeLabel,
  responseTimeSchema,
} from "@/lib/seller/responseTime";

describe("response time", () => {
  it("formats canonical codes for customers", () => {
    expect(responseTimeLabel("WITHIN_1_HOUR")).toBe("Within 1 hour");
    expect(responseTimeLabel("WITHIN_2_DAYS")).toBe("Within 2 days");
  });

  it("maps legacy free text to a canonical code", () => {
    expect(responseTimeCode("1 hour")).toBe("WITHIN_1_HOUR");
    expect(responseTimeCode("Within 1 day")).toBe("WITHIN_24_HOURS");
    expect(responseTimeCode("7 days")).toBe("WITHIN_1_WEEK");
  });

  it("returns null for unknown values", () => {
    expect(responseTimeCode("whenever")).toBeNull();
    expect(responseTimeLabel("whenever")).toBeNull();
  });

  it("only accepts canonical values on write", () => {
    expect(responseTimeSchema.safeParse("WITHIN_4_HOURS").success).toBe(true);
    expect(responseTimeSchema.safeParse("4 hours").success).toBe(false);
  });
});
