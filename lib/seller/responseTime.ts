import { z } from "zod";

/**
 * Canonical response-time values. Stored as codes so the UI, API, and any
 * future mobile client share one vocabulary; `responseTimeLabel()` is the only
 * place that turns a code into customer-facing copy.
 */
export const RESPONSE_TIME_OPTIONS = [
  { value: "WITHIN_1_HOUR", label: "Within 1 hour" },
  { value: "WITHIN_2_HOURS", label: "Within 2 hours" },
  { value: "WITHIN_4_HOURS", label: "Within 4 hours" },
  { value: "WITHIN_8_HOURS", label: "Within 8 hours" },
  { value: "WITHIN_24_HOURS", label: "Within 24 hours" },
  { value: "WITHIN_2_DAYS", label: "Within 2 days" },
  { value: "WITHIN_3_DAYS", label: "Within 3 days" },
  { value: "WITHIN_1_WEEK", label: "Within 1 week" },
] as const;

export type ResponseTime = (typeof RESPONSE_TIME_OPTIONS)[number]["value"];

export const RESPONSE_TIME_VALUES = RESPONSE_TIME_OPTIONS.map(
  (option) => option.value,
) as [ResponseTime, ...ResponseTime[]];

export const responseTimeSchema = z.enum(RESPONSE_TIME_VALUES);

export const DEFAULT_RESPONSE_TIME: ResponseTime = "WITHIN_24_HOURS";

const LEGACY_RESPONSE_TIMES: Record<string, ResponseTime> = {
  "1 hour": "WITHIN_1_HOUR",
  "within 1 hour": "WITHIN_1_HOUR",
  "1hr": "WITHIN_1_HOUR",
  "2 hours": "WITHIN_2_HOURS",
  "within 2 hours": "WITHIN_2_HOURS",
  "4 hours": "WITHIN_4_HOURS",
  "within 4 hours": "WITHIN_4_HOURS",
  "8 hours": "WITHIN_8_HOURS",
  "within 8 hours": "WITHIN_8_HOURS",
  "1 day": "WITHIN_24_HOURS",
  "within 1 day": "WITHIN_24_HOURS",
  "24 hours": "WITHIN_24_HOURS",
  "within 24 hours": "WITHIN_24_HOURS",
  "2 days": "WITHIN_2_DAYS",
  "within 2 days": "WITHIN_2_DAYS",
  "3 days": "WITHIN_3_DAYS",
  "within 3 days": "WITHIN_3_DAYS",
  "1 week": "WITHIN_1_WEEK",
  "within 1 week": "WITHIN_1_WEEK",
  "7 days": "WITHIN_1_WEEK",
  "within 7 days": "WITHIN_1_WEEK",
};

/** Resolve either a canonical code or a legacy free-text value to a code. */
export function responseTimeCode(
  value: string | null | undefined,
): ResponseTime | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const direct = RESPONSE_TIME_OPTIONS.find(
    (option) => option.value === raw.toUpperCase(),
  );
  if (direct) return direct.value;

  return LEGACY_RESPONSE_TIMES[raw.toLowerCase()] ?? null;
}

/** Customer-facing copy for a stored response-time value. */
export function responseTimeLabel(
  value: string | null | undefined,
): string | null {
  const code = responseTimeCode(value);
  if (!code) return null;
  return (
    RESPONSE_TIME_OPTIONS.find((option) => option.value === code)?.label ?? null
  );
}
