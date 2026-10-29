/**
 * Runs once when a Next.js server instance starts.
 *
 * Prisma returns `bigint` for money columns. `JSON.stringify` throws on BigInt,
 * which makes `NextResponse.json()` fail with a 500 for any route that returns a
 * Prisma record containing one (listings, orders, payments, wallet, ...).
 *
 * The API contract already exposes minor units as strings, so making BigInt
 * JSON-serializable globally is safe and keeps every route consistent.
 */
export async function register() {
  if (typeof BigInt === "undefined") return;

  const prototype = BigInt.prototype as unknown as {
    toJSON?: () => string;
  };

  if (typeof prototype.toJSON !== "function") {
    Object.defineProperty(prototype, "toJSON", {
      value(this: bigint) {
        return this.toString();
      },
      writable: true,
      configurable: true,
    });
  }
}
