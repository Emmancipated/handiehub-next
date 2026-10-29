import {
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export const DEFAULT_PHONE_COUNTRY = "NG";

/** Countries offered by the seller onboarding country picker. */
export const PHONE_COUNTRIES = [
  { code: "NG", name: "Nigeria", example: "+234 801 234 5678" },
  { code: "GH", name: "Ghana", example: "+233 24 123 4567" },
  { code: "KE", name: "Kenya", example: "+254 712 345 678" },
  { code: "ZA", name: "South Africa", example: "+27 82 123 4567" },
] as const;

export type PhoneCountry = (typeof PHONE_COUNTRIES)[number]["code"];

export function phoneCountry(code: string | null | undefined) {
  return (
    PHONE_COUNTRIES.find((country) => country.code === code?.toUpperCase()) ??
    PHONE_COUNTRIES[0]
  );
}

/**
 * Turn user input into a canonical E.164 number.
 *
 * Accepts international numbers (`+234…`) as well as local numbers for the
 * supplied country (`0801…` for NG). Returns `null` when the number is not a
 * valid phone number for that region.
 */
export function normalizePhone(
  value: string | null | undefined,
  country: string | null | undefined = DEFAULT_PHONE_COUNTRY,
): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const withoutInternationalPrefix = raw.startsWith("00")
    ? `+${raw.slice(2)}`
    : raw;

  const region = (country ?? DEFAULT_PHONE_COUNTRY).toUpperCase();
  const regionCode: CountryCode = isSupportedCountry(region)
    ? (region as CountryCode)
    : DEFAULT_PHONE_COUNTRY;

  const parsed = parsePhoneNumberFromString(
    withoutInternationalPrefix,
    regionCode,
  );

  if (!parsed || !parsed.isValid()) return null;

  return parsed.number;
}

export function phoneExample(country: string | null | undefined): string {
  return phoneCountry(country).example;
}
