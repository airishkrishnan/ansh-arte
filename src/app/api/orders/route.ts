import { NextResponse } from "next/server";
import { notifyNewOrder, placeOrder, type CartInput, type CustomerInput } from "@/lib/orders";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: real customers never fill this hidden field
  if (str(body.website, 100)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const c = (body.customer ?? {}) as Record<string, unknown>;
  const customer: CustomerInput = {
    name: str(c.name, 80),
    phone: str(c.phone, 15),
    email: str(c.email, 120),
    address: str(c.address, 300),
    city: str(c.city, 60),
    state: str(c.state, 60),
    pincode: str(c.pincode, 6),
    notes: str(c.notes, 300),
  };
  const cart: CartInput = Array.isArray(body.cart)
    ? body.cart
        .slice(0, 30)
        .map((l: { product_id?: unknown; qty?: unknown }) => ({
          product_id: str(l?.product_id, 64),
          qty: Math.max(1, Math.min(10, Number(l?.qty) || 1)),
        }))
        .filter((l) => l.product_id)
    : [];

  if (!customer.name || !/^[0-9+ ]{10,15}$/.test(customer.phone) || !customer.address || !/^\d{6}$/.test(customer.pincode)) {
    return NextResponse.json({ error: "Please check your name, phone, address and PIN code." }, { status: 400 });
  }
  if (cart.length === 0) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });

  try {
    const order = await placeOrder(customer, cart);
    await notifyNewOrder({
      number: order.number,
      total: order.total,
      name: customer.name,
      items: cart.reduce((n, l) => n + l.qty, 0),
    });
    return NextResponse.json(order);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
