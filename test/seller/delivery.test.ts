import {
  deliveryEstimateSchema,
  deliveryToMinutes,
  formatDeliveryEstimate,
  minutesToDeliveryForm,
} from "@/lib/seller/delivery";

describe("delivery estimates", () => {
  it("converts every unit to minutes", () => {
    expect(deliveryToMinutes({ min: 30, max: 90, unit: "MINUTES" })).toEqual({
      minMinutes: 30,
      maxMinutes: 90,
    });
    expect(deliveryToMinutes({ min: 2, max: 4, unit: "HOURS" })).toEqual({
      minMinutes: 120,
      maxMinutes: 240,
    });
    expect(deliveryToMinutes({ min: 1, max: 2, unit: "DAYS" })).toEqual({
      minMinutes: 1440,
      maxMinutes: 2880,
    });
  });

  it("formats ranges with one consistent unit", () => {
    expect(formatDeliveryEstimate(120, 240)).toBe("2–4 hours");
    expect(formatDeliveryEstimate(1440, 2880)).toBe("1–2 days");
    expect(formatDeliveryEstimate(30, 90)).toBe("30–90 minutes");
    expect(formatDeliveryEstimate(180, 180)).toBe("3 hours");
  });

  it("picks the largest whole unit when loading a saved range", () => {
    expect(minutesToDeliveryForm(120, 240)).toEqual({
      min: "2",
      max: "4",
      unit: "HOURS",
    });
    expect(minutesToDeliveryForm(1440, 2880)).toEqual({
      min: "1",
      max: "2",
      unit: "DAYS",
    });
    expect(minutesToDeliveryForm(90, 90)).toEqual({
      min: "90",
      max: "90",
      unit: "MINUTES",
    });
    expect(minutesToDeliveryForm(null, null)).toEqual({
      min: "",
      max: "",
      unit: "DAYS",
    });
  });

  it("rejects inverted and non-positive ranges", () => {
    expect(
      deliveryEstimateSchema.safeParse({ min: 5, max: 2, unit: "HOURS" })
        .success,
    ).toBe(false);
    expect(
      deliveryEstimateSchema.safeParse({ min: 0, max: 2, unit: "DAYS" }).success,
    ).toBe(false);
    expect(
      deliveryEstimateSchema.safeParse({ min: 2, max: 4, unit: "WEEKS" })
        .success,
    ).toBe(false);
  });

  it("caps estimates at 365 days", () => {
    expect(
      deliveryEstimateSchema.safeParse({ min: 1, max: 366, unit: "DAYS" })
        .success,
    ).toBe(false);
    expect(
      deliveryEstimateSchema.safeParse({ min: 1, max: 365, unit: "DAYS" })
        .success,
    ).toBe(true);
  });
});
