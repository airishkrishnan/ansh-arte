"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LineThumb } from "@/components/bag-drawer";
import { useCart } from "@/components/cart";
import { WhatsAppIcon } from "@/components/icons";
import { formatPrice } from "@/lib/site";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

export function CheckoutForm({ shippingFee, freeShippingAbove }: { shippingFee: number; freeShippingAbove: number }) {
  const { lines, subtotal, ready, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", notes: "", website: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const shipping = subtotal === 0 || subtotal >= freeShippingAbove ? 0 : shippingFee;

  // Fill city and state from the PIN code (free India Post lookup)
  const onPin = async (pin: string) => {
    setForm((f) => ({ ...f, pincode: pin }));
    if (!/^\d{6}$/.test(pin)) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      const po = data?.[0]?.PostOffice?.[0];
      if (po) {
        setForm((f) => ({
          ...f,
          city: f.city || po.District,
          state: STATES.find((s) => s.toLowerCase() === String(po.State).toLowerCase()) ?? f.state,
        }));
      }
    } catch {}
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { website, ...customer } = form;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer,
          website,
          cart: lines.map((l) => ({ product_id: l.product_id, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place the order");
      clear();
      router.push(`/order/${data.number}?k=${data.key}&new=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order");
      setBusy(false);
    }
  };

  if (ready && lines.length === 0 && !busy) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-3xl">Your bag is empty</p>
        <Link href="/earrings" className="btn btn-primary mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
      <div className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="eyebrow mb-4">Contact</legend>
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="field" required autoComplete="name" value={form.name} onChange={set("name")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="phone">WhatsApp number</label>
              <input
                id="phone"
                className="field"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                pattern="[0-9+ ]{10,15}"
                placeholder="10-digit mobile"
                value={form.phone}
                onChange={set("phone")}
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email (optional)</label>
              <input id="email" className="field" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="eyebrow mb-4">Delivery address</legend>
          <div>
            <label className="label" htmlFor="address">House, street, area</label>
            <textarea
              id="address"
              className="field min-h-24"
              required
              autoComplete="street-address"
              value={form.address}
              onChange={set("address")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="pincode">PIN code</label>
              <input
                id="pincode"
                className="field"
                required
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="\d{6}"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => onPin(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div>
              <label className="label" htmlFor="city">City</label>
              <input id="city" className="field" required autoComplete="address-level2" value={form.city} onChange={set("city")} />
            </div>
            <div>
              <label className="label" htmlFor="state">State</label>
              <select id="state" className="field" required value={form.state} onChange={set("state")}>
                <option value="">Select</option>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="notes">Note for us (optional)</label>
            <input id="notes" className="field" placeholder="Gift wrap, delivery time…" value={form.notes} onChange={set("notes")} />
          </div>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            value={form.website}
            onChange={set("website")}
            aria-hidden="true"
          />
        </fieldset>
      </div>

      <aside className="h-fit space-y-6 border border-line bg-paper p-5 md:p-7 lg:sticky lg:top-28">
        <p className="eyebrow">Order summary</p>
        <ul className="divide-y divide-line">
          {lines.map((l) => (
            <li key={l.product_id} className="flex gap-4 py-4">
              <LineThumb image={l.image} kind={l.kind} material={l.material} />
              <div className="flex flex-1 justify-between gap-3">
                <div>
                  <p className="font-serif text-lg leading-snug">{l.name}</p>
                  <p className="text-xs text-muted">Qty {l.qty}</p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(l.price * l.qty)}</p>
              </div>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-semibold uppercase tracking-[0.12em]">Total</dt>
            <dd className="font-serif text-3xl">{formatPrice(subtotal + shipping)}</dd>
          </div>
        </dl>
        {error && <p className="border border-temple/30 bg-temple/5 p-3 text-sm text-temple">{error}</p>}
        <button type="submit" className="btn btn-whatsapp w-full" disabled={busy || !ready}>
          <WhatsAppIcon className="size-4" />
          {busy ? "Placing order…" : "Place order & confirm on WhatsApp"}
        </button>
        <ol className="space-y-1.5 text-xs leading-relaxed text-ink-soft">
          <li>1. We save your order and open WhatsApp with the details.</li>
          <li>2. We confirm availability in the chat.</li>
          <li>3. You pay by UPI (GPay, PhonePe, Paytm) and we ship.</li>
        </ol>
      </aside>
    </form>
  );
}
