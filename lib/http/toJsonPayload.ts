/**
 * Convert a value into a JSON-safe shape for API responses.
 *
 * Prisma returns `BigInt` for money columns; `JSON.stringify` throws on BigInt,
 * which would turn a successful query into a 500. This walks the value with a
 * replacer that stringifies BigInts (the project convention is integer minor
 * units as strings at JSON boundaries) and returns a plain object.
 */
export function toJsonPayload<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === "bigint" ? item.toString() : item,
    ),
  ) as T;
}
