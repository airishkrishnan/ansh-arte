import type { CartLine } from "@/components/cart";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

const item = (l: Pick<CartLine, "product_id" | "name" | "price" | "kind" | "material">, qty: number) => ({
  item_id: l.product_id,
  item_name: l.name,
  item_category: l.kind,
  item_variant: l.material,
  price: l.price,
  quantity: qty,
});

/** Sends a Google Analytics event. Does nothing when analytics is not set up. */
export function track(event: string, params: Record<string, unknown>) {
  try {
    window.gtag?.("event", event, params);
  } catch {}
}

export const trackAddToCart = (line: Omit<CartLine, "qty">, qty: number) =>
  track("add_to_cart", { currency: "INR", value: line.price * qty, items: [item(line, qty)] });

export const trackPurchase = (orderNumber: string, total: number, shipping: number, lines: CartLine[]) =>
  track("purchase", {
    transaction_id: orderNumber,
    currency: "INR",
    value: total,
    shipping,
    items: lines.map((l) => item(l, l.qty)),
  });
