"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/account";
import { LineThumb } from "@/components/bag-drawer";
import { useCart } from "@/components/cart";
import { WhatsAppIcon } from "@/components/icons";
import { trackPurchase } from "@/lib/analytics";
import { STATES, lookupPin } from "@/lib/india";
import { formatPrice } from "@/lib/site";
import { getCustomerSupabase } from "@/lib/supabase/client";
import type { Address } from "@/lib/types";

export function CheckoutForm({ shippingFee, freeShippingAbove }: { shippingFee: number; freeShippingAbove: number }) {
  const { lines, subtotal, ready, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", notes: "", website: "",
  });
  const account = useAccount();
  const signedIn = account.ready && !!account.user;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [picked, setPicked] = useState<string>("new");
  const [saveAddress, setSaveAddress] = useState(true);
  const filled = useRef(false);

  const pickAddress = (a: Address) => {
    setPicked(a.id);
    setForm((f) => ({ ...f, name: a.name, phone: a.phone, address: a.address, city: a.city, state: a.state, pincode: a.pincode }));
  };
  const newAddress = () => {
    setPicked("new");
    setForm((f) => ({ ...f, address: "", city: "", state: "", pincode: "" }));
  };

  // Signed-in customers get their details and default address filled in
  useEffect(() => {
    if (!signedIn || filled.current) return;
    filled.current = true;
    const { profile, user } = account;
    setForm((f) => ({
      ...f,
      name: f.name || profile.name,
      phone: f.phone || profile.phone,
      email: f.email || user?.email || "",
    }));
    getCustomerSupabase()
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as Address[];
        setAddresses(list);
        if (list[0]) pickAddress(list[0]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill once, when sign-in is known
  }, [signedIn]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const shipping = subtotal === 0 || subtotal >= freeShippingAbove ? 0 : shippingFee;

  // Fill city and state from the PIN code
  const onPin = async (pin: string) => {
    setForm((f) => ({ ...f, pincode: pin }));
    const found = await lookupPin(pin);
    if (found) setForm((f) => ({ ...f, city: f.city || found.city, state: found.state || f.state }));
  };

  // Save the new address and fill in a blank profile, so next time is one tap
  const rememberDetails = async () => {
    try {
      const jobs: PromiseLike<unknown>[] = [];
      if (picked === "new" && saveAddress) {
        const { name, phone, address, city, state, pincode } = form;
        jobs.push(
          getCustomerSupabase()
            .from("addresses")
            .insert({ name, phone, address, city, state, pincode, is_default: addresses.length === 0 }),
        );
      }
      if (!account.profile.name || !account.profile.phone) {
        jobs.push(
          account.saveProfile({ name: account.profile.name || form.name, phone: account.profile.phone || form.phone }),
        );
      }
      await Promise.all(jobs);
    } catch {}
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { website, ...customer } = form;
      const token = await account.token();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          customer,
          website,
          cart: lines.map((l) => ({ product_id: l.product_id, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place the order");
      if (token) await rememberDetails();
      trackPurchase(data.number, data.total, shipping, lines);
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
        {account.enabled && account.ready && !signedIn && (
          <p className="border border-line bg-paper px-4 py-3 text-sm text-ink-soft">
            Have an account?{" "}
            <Link href="/account/login?next=/checkout" className="font-semibold text-brass-deep underline underline-offset-4">
              Sign in
            </Link>{" "}
            for faster checkout and to follow this order in My account. Or just continue as a guest.
          </p>
        )}
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
              <label className="label" htmlFor="email">Email (optional, for order updates)</label>
              <input id="email" className="field" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="eyebrow mb-4">Delivery address</legend>
          {addresses.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => pickAddress(a)}
                  className={`border p-3 text-left text-sm transition-colors ${picked === a.id ? "border-ink bg-paper" : "border-line hover:border-ink-soft"}`}
                  aria-pressed={picked === a.id}
                >
                  <span className="block font-semibold">{a.name}</span>
                  <span className="line-clamp-2 text-ink-soft">
                    {a.address}, {a.city} {a.pincode}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={newAddress}
                className={`border border-dashed p-3 text-left text-sm font-semibold ${picked === "new" ? "border-ink bg-paper" : "border-line hover:border-ink-soft"}`}
                aria-pressed={picked === "new"}
              >
                + Deliver to a new address
              </button>
            </div>
          )}
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
          {signedIn && picked === "new" && (
            <label className="flex items-center gap-3 text-sm text-ink-soft">
              <input type="checkbox" className="size-4 accent-[var(--color-ink)]" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              Save this address to my account
            </label>
          )}
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
        <p className="text-xs leading-relaxed text-muted">
          By placing your order you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">terms</Link>,{" "}
          <Link href="/refund-policy" className="underline underline-offset-2">refund policy</Link> and{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2">privacy policy</Link>.
        </p>
      </aside>
    </form>
  );
}
