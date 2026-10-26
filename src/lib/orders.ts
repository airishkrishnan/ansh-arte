import "server-only";
import { demo } from "./demo";
import { DEFAULT_SETTINGS, SITE_URL, formatPrice, shippingFor } from "./site";
import { getServerSupabase, supabaseConfigured } from "./supabase/client";
import type { OrderItem, PublicOrder } from "./types";

export type CustomerInput = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
};

export type CartInput = { product_id: string; qty: number }[];

// Orders placed while Supabase is not connected live only in memory, so the
// checkout flow can be tried out on a local preview.
const demoOrders = new Map<string, PublicOrder & { key: string }>();

/** `accessToken` links the order to the signed-in customer's account. */
export async function placeOrder(customer: CustomerInput, cart: CartInput, accessToken?: string) {
  if (supabaseConfigured) {
    let { data, error } = await getServerSupabase(accessToken).rpc("place_order", { customer, cart });
    // An expired sign-in must never block an order: place it as a guest instead
    if (error && accessToken && /jwt|token/i.test(error.message)) {
      ({ data, error } = await getServerSupabase().rpc("place_order", { customer, cart }));
    }
    if (error) throw new Error(error.message);
    return data as { number: string; key: string; total: number };
  }

  const items: OrderItem[] = cart.map((c) => {
    const p = demo.products.find((x) => x.id === c.product_id);
    if (!p) throw new Error("A piece in your bag is no longer available");
    if (p.stock < c.qty) throw new Error(`${p.name} is sold out or has only ${p.stock} left`);
    return { product_id: p.id, name: p.name, slug: p.slug, price: p.price, qty: c.qty, image: "", material: p.material };
  });
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const shipping = shippingFor(DEFAULT_SETTINGS, subtotal);
  const number = `AA-${1001 + demoOrders.size}`;
  const key = crypto.randomUUID().replace(/-/g, "");
  demoOrders.set(number, {
    key,
    number,
    customer_name: customer.name,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    status: "new",
    courier: "",
    tracking_number: "",
    tracking_url: "",
    history: [{ status: "new", at: new Date().toISOString() }],
    created_at: new Date().toISOString(),
  });
  return { number, key, total: subtotal + shipping };
}

export async function getPublicOrder(number: string, key: string): Promise<PublicOrder | null> {
  if (!number || !key) return null;
  if (supabaseConfigured) {
    const { data } = await getServerSupabase().rpc("get_order", { order_number: number, key });
    return (data as PublicOrder) ?? null;
  }
  const o = demoOrders.get(number.toUpperCase());
  return o && o.key === key ? o : null;
}

export async function findOrderKey(number: string, phone: string): Promise<string | null> {
  if (supabaseConfigured) {
    const { data } = await getServerSupabase().rpc("find_order", { order_number: number, phone_number: phone });
    return (data as string) ?? null;
  }
  const o = demoOrders.get(number.trim().toUpperCase());
  const last10 = (s: string) => s.replace(/\D/g, "").slice(-10);
  return o && last10(o.phone) === last10(phone) ? o.key : null;
}

/**
 * Sends a phone notification for a new order. Uses ntfy (free push app) and/or
 * Telegram, whichever is configured. Never throws: an order must not fail
 * because a notification did.
 */
export async function notifyNewOrder(o: { number: string; total: number; name: string; items: number }) {
  const title = `New order ${o.number} · ${formatPrice(o.total)}`;
  const body = `${o.name} ordered ${o.items} ${o.items === 1 ? "piece" : "pieces"}. Check WhatsApp to confirm.`;
  const adminUrl = `${SITE_URL}/admin/orders?n=${encodeURIComponent(o.number)}`;
  const jobs: Promise<unknown>[] = [];

  const topic = process.env.NTFY_TOPIC;
  if (topic) {
    jobs.push(
      fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
        method: "POST",
        body,
        headers: {
          Title: title.replace(/₹/g, "Rs "),
          Tags: "sparkles,shopping_bags",
          Priority: "high",
          Click: adminUrl,
        },
      }),
    );
  }

  const tg = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text: `${title}\n${body}\n${adminUrl}` }),
      }),
    );
  }

  await Promise.race([
    Promise.allSettled(jobs),
    new Promise((r) => setTimeout(r, 4000)),
  ]);
}
