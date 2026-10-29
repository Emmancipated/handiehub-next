import { z } from "zod";

export const DELIVERY_UNITS = ["MINUTES", "HOURS", "DAYS"] as const;
export type DeliveryUnit = (typeof DELIVERY_UNITS)[number];

export const DELIVERY_UNIT_MINUTES: Record<DeliveryUnit, number> = {
  MINUTES: 1,
  HOURS: 60,
  DAYS: 24 * 60,
};

export const DELIVERY_MAX_MINUTES = 365 * DELIVERY_UNIT_MINUTES.DAYS;

export const DELIVERY_UNIT_LABELS: Record<DeliveryUnit, string> = {
  MINUTES: "Minutes",
  HOURS: "Hours",
  DAYS: "Days",
};

/** A range supplied by the seller, in whichever unit they picked. */
export const deliveryEstimateSchema = z
  .object({
    min: z
      .number()
      .int()
      .min(1, "Enter a number greater than 0")
      .max(DELIVERY_MAX_MINUTES, "Delivery estimate is too long"),
    max: z
      .number()
      .int()
      .min(1, "Enter a number greater than 0")
      .max(DELIVERY_MAX_MINUTES, "Delivery estimate is too long"),
    unit: z.enum(DELIVERY_UNITS),
  })
  .superRefine((value, ctx) => {
    if (value.max < value.min) {
      ctx.addIssue({
        code: "custom",
        message: "Maximum must be greater than or equal to the minimum",
        path: ["max"],
      });
    }

    const multiplier = DELIVERY_UNIT_MINUTES[value.unit];
    if (value.max * multiplier > DELIVERY_MAX_MINUTES) {
      ctx.addIssue({
        code: "custom",
        message: "Delivery estimate cannot exceed 365 days",
        path: ["max"],
      });
    }
  });

export type DeliveryEstimateInput = z.infer<typeof deliveryEstimateSchema>;

export type DeliveryEstimateMinutes = {
  minMinutes: number;
  maxMinutes: number;
};

export type DeliveryEstimateForm = {
  min: string;
  max: string;
  unit: DeliveryUnit;
};

export function deliveryToMinutes(
  estimate: DeliveryEstimateInput,
): DeliveryEstimateMinutes {
  const multiplier = DELIVERY_UNIT_MINUTES[estimate.unit];
  return {
    minMinutes: estimate.min * multiplier,
    maxMinutes: estimate.max * multiplier,
  };
}

/** Pick the largest unit that keeps both ends whole, for editing. */
export function minutesToDeliveryForm(
  minMinutes: number | null | undefined,
  maxMinutes: number | null | undefined,
): DeliveryEstimateForm {
  if (minMinutes == null || maxMinutes == null) {
    return { min: "", max: "", unit: "DAYS" };
  }

  if (
    minMinutes % DELIVERY_UNIT_MINUTES.DAYS === 0 &&
    maxMinutes % DELIVERY_UNIT_MINUTES.DAYS === 0
  ) {
    return {
      min: String(minMinutes / DELIVERY_UNIT_MINUTES.DAYS),
      max: String(maxMinutes / DELIVERY_UNIT_MINUTES.DAYS),
      unit: "DAYS",
    };
  }

  if (
    minMinutes % DELIVERY_UNIT_MINUTES.HOURS === 0 &&
    maxMinutes % DELIVERY_UNIT_MINUTES.HOURS === 0
  ) {
    return {
      min: String(minMinutes / DELIVERY_UNIT_MINUTES.HOURS),
      max: String(maxMinutes / DELIVERY_UNIT_MINUTES.HOURS),
      unit: "HOURS",
    };
  }

  return {
    min: String(minMinutes),
    max: String(maxMinutes),
    unit: "MINUTES",
  };
}

function plural(value: number, singular: string): string {
  return `${value} ${singular}${value === 1 ? "" : "s"}`;
}

/** Human copy for a single duration. */
export function formatDuration(minutes: number): string {
  if (minutes % DELIVERY_UNIT_MINUTES.DAYS === 0) {
    return plural(minutes / DELIVERY_UNIT_MINUTES.DAYS, "day");
  }
  if (minutes % DELIVERY_UNIT_MINUTES.HOURS === 0) {
    return plural(minutes / DELIVERY_UNIT_MINUTES.HOURS, "hour");
  }
  return plural(minutes, "minute");
}

/**
 * Customer-facing range. Both ends use the same unit so a range never reads
 * like "1 hour–2 days"; the largest unit that divides both ends wins.
 */
export function formatDeliveryEstimate(
  minMinutes: number | null | undefined,
  maxMinutes: number | null | undefined,
): string | null {
  if (minMinutes == null || maxMinutes == null) return null;
  if (minMinutes === maxMinutes) return formatDuration(minMinutes);

  if (
    minMinutes % DELIVERY_UNIT_MINUTES.DAYS === 0 &&
    maxMinutes % DELIVERY_UNIT_MINUTES.DAYS === 0
  ) {
    return `${minMinutes / DELIVERY_UNIT_MINUTES.DAYS}–${
      maxMinutes / DELIVERY_UNIT_MINUTES.DAYS
    } days`;
  }

  if (
    minMinutes % DELIVERY_UNIT_MINUTES.HOURS === 0 &&
    maxMinutes % DELIVERY_UNIT_MINUTES.HOURS === 0
  ) {
    return `${minMinutes / DELIVERY_UNIT_MINUTES.HOURS}–${
      maxMinutes / DELIVERY_UNIT_MINUTES.HOURS
    } hours`;
  }

  return `${minMinutes}–${maxMinutes} minutes`;
}
