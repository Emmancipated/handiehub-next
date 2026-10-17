import crypto from "crypto";

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not configured");
}

const BASE_URL = process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";

export class PaystackError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function paystackRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new PaystackError(body.message || "Paystack API error", res.status, body);
  }
  return body;
}

export function verifySignature(
  rawBody: string | Buffer,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}

export async function initializePayment({
  email,
  amount,
  reference,
  callbackUrl,
  metadata,
}: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  return paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount,
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });
}

export async function verifyPayment(reference: string) {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
}
