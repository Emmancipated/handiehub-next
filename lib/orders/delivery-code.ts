import crypto from "node:crypto";

/** Delivery codes are short-lived and shown only to the buyer. */
export const DELIVERY_CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const DELIVERY_CODE_MAX_ATTEMPTS = 5;

export function generateDeliveryCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function deliveryCodeExpiry(from = new Date()): Date {
  return new Date(from.getTime() + DELIVERY_CODE_TTL_MS);
}
