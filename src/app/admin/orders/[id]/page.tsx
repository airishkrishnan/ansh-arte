"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { WhatsAppIcon } from "@/components/icons";
import { COURIERS, DEFAULT_SETTINGS, SITE_URL, formatPrice, whatsappLink, withIndiaCode } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { ORDER_STEPS, materialLabel, statusLabel, type Order, type OrderStatus, type Settings } from "@/lib/types";

function customerMessage(o: Order, s: Settings) {
  const first = o.customer_name.split(" ")[0];
  const link = `${SITE_URL}/order/${o.number}?k=${o.access_key}`;
  switch (o.status) {
    case "new":
      return `Hi ${first}! Thank you for your Ansh Arte order ${o.number}. We're checking availability and will confirm shortly.`;
    case "confirmed":
      return `Hi ${first}! Your Ansh Arte order ${o.number} is confirmed ✨\n\nTotal: ${formatPrice(o.total)}\n\nPay by UPI (GPay, PhonePe, Paytm) from your order page:\n${link}\n\nOr pay to UPI ID ${s.upi_id}${s.gpay_number ? ` / GPay ${s.gpay_number}` : ""} and share the screenshot here. Thank you!`;
    case "paid":
      return `Hi ${first}, we've received your payment of ${formatPrice(o.total)} for order ${o.number}. Thank you! 🙏 We'll pack it with care and share tracking details soon.`;
    case "packed":
      return `Hi ${first}, your order ${o.number} is packed and ready to ship ✨ We'll share the tracking number as soon as it's dispatched.`;
    case "shipped":
      return `Hi ${first}! Your Ansh Arte order ${o.number} is on its way 🚚\n\nCourier: ${o.courier}\nTracking no: ${o.tracking_number}${o.tracking_url ? `\nTrack here: ${o.tracking_url}` : ""}\n\nOrder page: ${link}`;
    case "delivered":
      return `Hi ${first}, your order ${o.number} has been delivered. We hope you love it! 💛 We'd be so grateful if you could share a photo or a quick review.`;
    case "cancelled":
      return `Hi ${first}, your order ${o.number} has been cancelled. If you have already paid, we will refund you by UPI shortly. Please message us with any questions.`;
  }
}

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  new: { to: "confirmed", label: "Confirm order" },
  confirmed: { to: "paid", label: "Mark as paid" },
  paid: { to: "packed", label: "Mark as packed" },
  delivered: undefined,
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [justChanged, setJustChanged] = useState(false);
  const [ship, setShip] = useState({ courier: COURIERS[0].name, tracking_number: "", tracking_url: "" });
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [emailed, setEmailed] = useState("");

  const load = useCallback(async () => {
    const sb = getBrowserSupabase();
    const [{ data }, { data: s }] = await Promise.all([
      sb.from("orders").select("*").eq("id", id).maybeSingle(),
      sb.from("settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (data) {
      const o = data as Order;
      setOrder(o);
      setNotes(o.admin_notes);
      setPaymentRef(o.payment_ref);
      if (o.courier) setShip({ courier: o.courier, tracking_number: o.tracking_number, tracking_url: o.tracking_url });
    }
    if (s) setSettings({ ...DEFAULT_SETTINGS, ...s });
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
  }, [load]);

  const update = async (patch: Partial<Order>) => {
    setBusy(true);
    setError("");
    const { data, error } = await getBrowserSupabase().from("orders").update(patch).eq("id", id).select("*").single();
    setBusy(false);
    if (error) return setError(error.message);
    setOrder(data as Order);
    if (patch.status) {
      setJustChanged(true);
      setEmailed("");
      emailCustomer().then(setEmailed);
    }
  };

  // Emails the customer about the new status, when they gave an email
  const emailCustomer = async () => {
    try {
      const { data } = await getBrowserSupabase().auth.getSession();
      const token = data.session?.access_token;
      if (!token) return "";
      const res = await fetch("/api/orders/email", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      const out = await res.json();
      return out.sent ? (out.to as string) : "";
    } catch {
      return "";
    }
  };

  if (!order) {
    return (
      <>
        <AdminHeader title="Order" />
        <p className="p-8 text-center text-sm text-muted">Loading…</p>
      </>
    );
  }

  const wa = whatsappLink(withIndiaCode(order.phone), customerMessage(order, settings));
  const next = NEXT[order.status];
  const trackingFor = (courier: string, n: string) => COURIERS.find((c) => c.name === courier)?.url(n) ?? "";

  return (
    <>
      <AdminHeader
        title={order.number}
        action={
          <Link href="/admin/orders" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            All orders
          </Link>
        }
      />
      <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} />
          <p className="text-xs text-muted">
            {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at))}
          </p>
        </div>

        {justChanged && (
          <div className="space-y-3 border border-[#1f7a4d]/30 bg-[#e6f2ea] p-4">
            <p className="text-sm">
              Marked as <strong>{statusLabel(order.status)}</strong>. Let {order.customer_name.split(" ")[0]} know:
            </p>
            <a href={wa} target="_blank" rel="noopener" className="btn btn-whatsapp w-full" onClick={() => setJustChanged(false)}>
              <WhatsAppIcon className="size-4" /> Send update on WhatsApp
            </a>
            {emailed && <p className="text-xs text-ink-soft">Also emailed to {emailed} ✓</p>}
          </div>
        )}

        {error && <p className="border border-temple/30 bg-temple/5 p-3 text-sm text-temple">{error}</p>}

        {/* Main action */}
        {order.status !== "cancelled" && order.status !== "delivered" && (
          <section className="space-y-3 border border-line bg-paper p-4">
            <p className="eyebrow">Next step</p>
            {order.status === "confirmed" && (
              <div>
                <label className="label" htmlFor="ref">UPI reference (optional)</label>
                <input id="ref" className="field" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Last 4–6 digits of the UPI ref" />
              </div>
            )}
            {(order.status === "packed" || order.status === "shipped") && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="courier">Courier</label>
                    <select
                      id="courier"
                      className="field"
                      value={ship.courier}
                      onChange={(e) =>
                        setShip((s) => ({ ...s, courier: e.target.value, tracking_url: trackingFor(e.target.value, s.tracking_number) }))
                      }
                    >
                      {COURIERS.map((c) => (
                        <option key={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="awb">Tracking no.</label>
                    <input
                      id="awb"
                      className="field"
                      value={ship.tracking_number}
                      onChange={(e) =>
                        setShip((s) => ({ ...s, tracking_number: e.target.value.trim(), tracking_url: trackingFor(s.courier, e.target.value.trim()) }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="turl">Tracking link</label>
                  <input id="turl" className="field text-sm" value={ship.tracking_url} onChange={(e) => setShip((s) => ({ ...s, tracking_url: e.target.value }))} />
                </div>
              </div>
            )}
            <div className="grid gap-2">
              {next && (
                <button
                  className="btn btn-primary w-full"
                  disabled={busy}
                  onClick={() => update(order.status === "confirmed" ? { status: next.to, payment_ref: paymentRef } : { status: next.to })}
                >
                  {next.label}
                </button>
              )}
              {order.status === "packed" && (
                <button
                  className="btn btn-primary w-full"
                  disabled={busy || !ship.tracking_number}
                  onClick={() => update({ status: "shipped", ...ship })}
                >
                  Mark as shipped
                </button>
              )}
              {order.status === "shipped" && (
                <>
                  <button className="btn btn-outline w-full" disabled={busy} onClick={() => update({ ...ship })}>
                    Save tracking changes
                  </button>
                  <button className="btn btn-primary w-full" disabled={busy} onClick={() => update({ status: "delivered" })}>
                    Mark as delivered
                  </button>
                </>
              )}
            </div>
            {order.status === "paid" && (
              <p className="text-xs text-muted">Pack the order, then add the courier details on the next step.</p>
            )}
          </section>
        )}

        <a href={wa} target="_blank" rel="noopener" className="btn btn-outline w-full">
          <WhatsAppIcon className="size-4" /> Message {order.customer_name.split(" ")[0]} on WhatsApp
        </a>

        {/* Items */}
        <section className="border border-line bg-paper p-4">
          <p className="eyebrow mb-3">Items</p>
          <ul className="divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.product_id} className="flex gap-3 py-3">
                <div className="size-14 shrink-0 overflow-hidden bg-sand">
                  {i.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- thumbnail
                    <img src={i.image} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium leading-snug">{i.name}</p>
                  <p className="text-xs text-muted">
                    {materialLabel(i.material)} · {formatPrice(i.price)} × {i.qty}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shipping ? formatPrice(order.shipping) : "Free"}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
        </section>

        {/* Customer */}
        <section className="space-y-2 border border-line bg-paper p-4 text-sm">
          <p className="eyebrow mb-1">Ship to</p>
          <p className="font-semibold">{order.customer_name}</p>
          <p className="whitespace-pre-line text-ink-soft">
            {order.address}
            {"\n"}
            {order.city}, {order.state} {order.pincode}
          </p>
          <p>
            <a href={`tel:${order.phone}`} className="underline underline-offset-4">{order.phone}</a>
            {order.email && <> · {order.email}</>}
          </p>
          {order.notes && <p className="bg-brass-soft/40 p-2 text-ink">Note: {order.notes}</p>}
          <button
            className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-deep"
            onClick={() =>
              navigator.clipboard.writeText(
                `${order.customer_name}\n${order.address}\n${order.city}, ${order.state} - ${order.pincode}\nPh: ${order.phone}`,
              )
            }
          >
            Copy address for courier
          </button>
        </section>

        {/* Timeline */}
        <section className="border border-line bg-paper p-4">
          <p className="eyebrow mb-3">History</p>
          <ol className="space-y-2 text-sm">
            {order.history.map((h, i) => (
              <li key={i} className="flex justify-between">
                <span>{statusLabel(h.status)}</span>
                <span className="text-muted">
                  {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(h.at))}
                </span>
              </li>
            ))}
          </ol>
          {order.payment_ref && <p className="mt-3 text-xs text-muted">UPI ref: {order.payment_ref}</p>}
        </section>

        <section className="space-y-2 border border-line bg-paper p-4">
          <label className="label" htmlFor="notes">Private notes</label>
          <textarea id="notes" className="field min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="btn btn-outline !min-h-10 w-full" disabled={busy || notes === order.admin_notes} onClick={() => update({ admin_notes: notes })}>
            Save notes
          </button>
        </section>

        <details className="border border-line bg-paper p-4 text-sm">
          <summary className="cursor-pointer font-semibold">More actions</summary>
          <div className="mt-4 space-y-3">
            <label className="label" htmlFor="setst">Set status manually</label>
            <select
              id="setst"
              className="field"
              value={order.status}
              onChange={(e) => update({ status: e.target.value as OrderStatus })}
            >
              {[...ORDER_STEPS.map((s) => s.status), "cancelled" as const].map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <a href={`${SITE_URL}/order/${order.number}?k=${order.access_key}`} target="_blank" className="block underline underline-offset-4">
              Open customer order page ↗
            </a>
            {order.status !== "cancelled" && (
              <button
                className="btn w-full border border-temple text-temple"
                disabled={busy}
                onClick={() => confirm(`Cancel order ${order.number}?`) && update({ status: "cancelled" })}
              >
                Cancel order
              </button>
            )}
          </div>
        </details>
      </div>
    </>
  );
}
