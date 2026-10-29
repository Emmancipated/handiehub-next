export type CartItem = {
  listingId: string;
  slug: string;
  title: string;
  priceMinor: number;
  currency: string;
  quantity: number;
  image?: string;
  sellerId: string;
  sellerName: string;
};

const STORAGE_KEY = "handiehub:cart:v1";
export const CART_CHANGED_EVENT = "handiehub:cart-changed";

function isCartItem(value: unknown): value is CartItem {
  const item = value as Partial<CartItem> | null;
  return Boolean(
    item &&
      typeof item.listingId === "string" &&
      typeof item.slug === "string" &&
      typeof item.title === "string" &&
      typeof item.priceMinor === "number" &&
      typeof item.quantity === "number" &&
      typeof item.sellerId === "string",
  );
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
  } catch {
    // Storage may be disabled (private mode); the cart then behaves as empty.
  }
}

/**
 * A cart holds one seller at a time so checkout maps cleanly onto the current
 * one-order-per-seller payment model. Adding an item from another seller
 * replaces the cart and reports that it did.
 */
export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1): {
  replaced: boolean;
} {
  const current = readCart();
  const differentSeller =
    current.length > 0 && current[0].sellerId !== item.sellerId;

  if (differentSeller) {
    writeCart([{ ...item, quantity }]);
    return { replaced: true };
  }

  const existing = current.find((row) => row.listingId === item.listingId);
  if (existing) {
    writeCart(
      current.map((row) =>
        row.listingId === item.listingId
          ? { ...row, quantity: row.quantity + quantity }
          : row,
      ),
    );
  } else {
    writeCart([...current, { ...item, quantity }]);
  }
  return { replaced: false };
}

export function updateCartQuantity(listingId: string, quantity: number): CartItem[] {
  const next = readCart()
    .map((row) =>
      row.listingId === listingId
        ? { ...row, quantity: Math.max(1, quantity) }
        : row,
    )
    .filter((row) => row.quantity > 0);
  writeCart(next);
  return next;
}

export function removeFromCart(listingId: string): CartItem[] {
  const next = readCart().filter((row) => row.listingId !== listingId);
  writeCart(next);
  return next;
}

export function clearCart(): void {
  writeCart([]);
}
