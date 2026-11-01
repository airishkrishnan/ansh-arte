"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPage } from "@/components/admin/shell";
import {
  ButtonGroup,
  Card,
  Icon,
  OrderPills,
  RoundButton,
  SectionTitle,
  customerKey,
  dayFmt,
  timeFmt,
  type IconName,
} from "@/components/admin/ui";
import { BrandLogo } from "@/components/brand";
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

const HISTORY_TEXT: Record<OrderStatus, string> = {
  new: "placed this order on the website.",
  confirmed: "Order confirmed and payment details shared.",
  paid: "Payment received by UPI.",
  packed: "Order packed.",
  shipped: "Order handed to the courier.",
  delivered: "Order delivered.",
  cancelled: "Order cancelled.",
};

const longFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

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
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [more, setMore] = useState(false);
  const [copied, setCopied] = useState(false);
  const [compact, setCompact] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

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
      const { count } = await sb.from("orders").select("id", { count: "exact", head: true }).ilike("phone", `%${customerKey(o.phone)}`);
      setOrderCount(count);
    }
    if (s) setSettings({ ...DEFAULT_SETTINGS, ...s });
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
  }, [load]);

  // Show the order number in the top bar once the big title scrolls away
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: "-64px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [order?.id]);

  const update = async (patch: Partial<Order>) => {
    setBusy(true);
    setError("");
    setMore(false);
    const { data, error } = await getBrowserSupabase().from("orders").update(patch).eq("id", id).select("*").single();
    setBusy(false);
    if (error) return setError(error.message);
    setOrder(data as Order);
    if (patch.status) {
      setJustChanged(true);
      setEmailed("");
      emailCustomer().then(setEmailed);
      scrollTo({ top: 0, behavior: "smooth" });
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
      <div className="px-4 pt-[max(env(safe-area-inset-top),0.75rem)] md:px-8 md:pt-6">
        <RoundButton icon="back" label="Back to orders" href="/admin/orders" />
        <p className="p-8 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const first = order.customer_name.split(" ")[0];
  const wa = whatsappLink(withIndiaCode(order.phone), customerMessage(order, settings));
  const trackingFor = (courier: string, n: string) => COURIERS.find((c) => c.name === courier)?.url(n) ?? "";
  const paid = !["new", "confirmed", "cancelled"].includes(order.status);
  const pcs = order.items.reduce((n, i) => n + i.qty, 0);
  const address = `${order.customer_name}\n${order.address}\n${order.city}, ${order.state} - ${order.pincode}\nPh: ${order.phone}`;
  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const fulfil: { tone: "gold" | "ink" | "plain" | "red"; label: string; icon: IconName } =
    order.status === "cancelled"
      ? { tone: "red", label: "Cancelled", icon: "close" }
      : order.status === "shipped"
        ? { tone: "ink", label: "Shipped", icon: "truck" }
        : order.status === "delivered"
          ? { tone: "plain", label: "Delivered", icon: "box" }
          : order.status === "packed"
            ? { tone: "gold", label: "Packed, ready to ship", icon: "box" }
            : { tone: "gold", label: order.status === "new" ? "Waiting for you to confirm" : "Unfulfilled", icon: "box" };

  // Timeline, newest first, grouped by day
  const events = [...order.history]
    .map((h, i) => ({ ...h, i }))
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((h) => ({
      day: dayLabel(h.at),
      at: h.at,
      text: h.status === "new" ? `${order.customer_name} ${HISTORY_TEXT.new}` : HISTORY_TEXT[h.status],
      ref: h.status === "paid" && order.payment_ref ? `UPI ref ${order.payment_ref}` : "",
      key: h.i,
    }));
  if (!events.length) events.push({ day: dayLabel(order.created_at), at: order.created_at, text: `${order.customer_name} ${HISTORY_TEXT.new}`, ref: "", key: -1 });

  return (
    <>
      <div className="print:hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-ivory/85 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl md:px-8 md:pt-5">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <RoundButton icon="back" label="Back to orders" href="/admin/orders" />
            <p className={`flex-1 truncate text-lg font-semibold transition-opacity ${compact ? "opacity-100" : "opacity-0"}`}>{order.number}</p>
            <ButtonGroup>
              <RoundButton icon="print" label="Print packing slip" onClick={() => print()} />
              <RoundButton icon="more" label="More actions" onClick={() => setMore(true)} />
            </ButtonGroup>
          </div>
        </div>

        <AdminPage narrow>
          <div className="px-1 pt-2">
            <h1 ref={titleRef} className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[2.1rem] font-semibold leading-none tracking-tight">{order.number}</span>
              <OrderPills status={order.status} />
            </h1>
            <p className="mt-2 text-sm text-muted">
              {longFmt.format(new Date(order.created_at))} at {timeFmt.format(new Date(order.created_at))} · Website
            </p>
          </div>

          {justChanged && (
            <div className="space-y-3 rounded-[1.5rem] border border-[#1f7a4d]/25 bg-[#e6f2ea] p-4">
              <p className="text-[0.95rem]">
                Marked as <strong>{statusLabel(order.status)}</strong>. Let {first} know:
              </p>
              <a href={wa} target="_blank" rel="noopener" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#1f7a4d] font-semibold text-white" onClick={() => setJustChanged(false)}>
                <WhatsAppIcon className="size-5" /> Send update on WhatsApp
              </a>
              {emailed && <p className="text-xs text-ink-soft">Also emailed to {emailed} ✓</p>}
            </div>
          )}

          {error && <p className="rounded-2xl border border-temple/30 bg-temple/5 p-3 text-sm text-temple">{error}</p>}

          {/* Fulfilment */}
          <section>
            <SectionTitle title={fulfil.label} icon={fulfil.icon} tone={fulfil.tone} />
            <Card className="p-4 md:p-5">
              <div className="space-y-3 text-[0.95rem]">
                <p className="flex items-center gap-3">
                  <Icon name="truck" className="size-5 text-muted" />
                  {order.courier ? `${order.courier}${order.tracking_number ? ` · ${order.tracking_number}` : ""}` : "Standard shipping"}
                </p>
                <p className="flex items-center gap-3">
                  <Icon name="pin" className="size-5 text-muted" />
                  {order.city}, {order.state}
                </p>
              </div>
              <ul className="mt-4 space-y-4">
                {order.items.map((i) => (
                  <li key={i.product_id} className="flex items-center gap-4">
                    <span className="size-[4.5rem] shrink-0 overflow-hidden rounded-2xl border border-line bg-sand">
                      {i.image && (
                        // eslint-disable-next-line @next/next/no-img-element -- thumbnail
                        <img src={i.image} alt="" className="size-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link href={`/product/${i.slug}`} target="_blank" className="block font-semibold leading-snug hover:underline">
                        {i.name}
                      </Link>
                      <span className="block text-sm text-muted">{materialLabel(i.material)}</span>
                      <span className="block text-sm text-ink-soft">{formatPrice(i.price)}</span>
                    </span>
                    <span className="font-semibold">× {i.qty}</span>
                  </li>
                ))}
              </ul>

              {order.status === "new" && (
                <Action hint="Check the pieces are in stock, then confirm. The customer then gets your UPI details.">
                  <Primary disabled={busy} onClick={() => update({ status: "confirmed" })}>Confirm order</Primary>
                </Action>
              )}
              {order.status === "paid" && (
                <Action hint="Pack it with care, then add the courier details on the next step.">
                  <Primary disabled={busy} onClick={() => update({ status: "packed" })}>Mark as packed</Primary>
                </Action>
              )}
              {(order.status === "packed" || order.status === "shipped") && (
                <Action>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label" htmlFor="courier">Courier</label>
                      <select
                        id="courier"
                        className="field !rounded-2xl"
                        value={ship.courier}
                        onChange={(e) => setShip((s) => ({ ...s, courier: e.target.value, tracking_url: trackingFor(e.target.value, s.tracking_number) }))}
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
                        className="field !rounded-2xl"
                        value={ship.tracking_number}
                        onChange={(e) => setShip((s) => ({ ...s, tracking_number: e.target.value.trim(), tracking_url: trackingFor(s.courier, e.target.value.trim()) }))}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="label" htmlFor="turl">Tracking link</label>
                    <input id="turl" className="field !rounded-2xl text-sm" value={ship.tracking_url} onChange={(e) => setShip((s) => ({ ...s, tracking_url: e.target.value }))} />
                  </div>
                  <div className="mt-4 grid gap-2">
                    {order.status === "packed" ? (
                      <Primary disabled={busy || !ship.tracking_number} onClick={() => update({ status: "shipped", ...ship })}>Mark as shipped</Primary>
                    ) : (
                      <>
                        <Primary disabled={busy} onClick={() => update({ status: "delivered" })}>Mark as delivered</Primary>
                        <Secondary disabled={busy} onClick={() => update({ ...ship })}>Save tracking changes</Secondary>
                      </>
                    )}
                  </div>
                </Action>
              )}
            </Card>
          </section>

          {/* Payment */}
          <section>
            <SectionTitle
              title={order.status === "cancelled" ? "Not charged" : paid ? "Paid" : "Payment pending"}
              icon={paid ? "cash" : "clock"}
              tone={order.status === "cancelled" ? "red" : paid ? "green" : "amber"}
            />
            <Card className="p-4 md:p-5">
              {order.status === "confirmed" && (
                <p className="mb-4 flex gap-3 rounded-2xl bg-[#f6ebc4] p-4 text-[0.95rem] leading-relaxed text-[#5e430c]">
                  <Icon name="alert" className="mt-0.5 size-5 shrink-0" />
                  Waiting for {first}&rsquo;s UPI payment. Check your UPI app for {formatPrice(order.total)} before you pack this order.
                </p>
              )}
              {order.status === "new" && (
                <p className="mb-4 flex gap-3 rounded-2xl bg-sand/70 p-4 text-[0.95rem] leading-relaxed text-ink-soft">
                  <Icon name="clock" className="mt-0.5 size-5 shrink-0" />
                  Confirm the order first. Your UPI details go to {first} with the confirmation.
                </p>
              )}
              <dl className="space-y-3 text-[0.95rem]">
                <Row label={`Subtotal · ${pcs} ${pcs === 1 ? "piece" : "pieces"}`} value={formatPrice(order.subtotal)} />
                <Row label="Shipping" value={order.shipping ? formatPrice(order.shipping) : "Free"} />
                <Row label="Total" value={formatPrice(order.total)} strong />
                <div className="border-t border-line pt-3">
                  <Row label="Paid" value={formatPrice(paid ? order.total : 0)} />
                </div>
                {!paid && order.status !== "cancelled" && <Row label="Balance" value={formatPrice(order.total)} />}
                {order.payment_ref && <Row label="UPI reference" value={order.payment_ref} />}
              </dl>
              {order.status === "confirmed" && (
                <div className="mt-5 space-y-3">
                  <div>
                    <label className="label" htmlFor="ref">UPI reference (optional)</label>
                    <input id="ref" className="field !rounded-2xl" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Last 4–6 digits of the UPI ref" />
                  </div>
                  <Primary disabled={busy} onClick={() => update({ status: "paid", payment_ref: paymentRef })}>Mark as paid</Primary>
                  <a href={wa} target="_blank" rel="noopener" className="flex h-12 items-center justify-center rounded-full border border-line bg-ivory font-semibold hover:bg-sand">
                    Send payment details again
                  </a>
                </div>
              )}
            </Card>
          </section>

          {/* Customer */}
          <section>
            <SectionTitle title="Customer" />
            <Card className="divide-y divide-line">
              <Link href={`/admin/customers/${customerKey(order.phone)}`} className="flex items-center justify-between gap-3 p-4 md:p-5">
                <span className="text-[1.05rem] font-semibold">{order.customer_name}</span>
                <span className="flex items-center gap-1 text-sm text-muted">
                  {orderCount === null ? "" : `${orderCount} ${orderCount === 1 ? "order" : "orders"}`}
                  <Icon name="chevron" className="size-4" />
                </span>
              </Link>
              <div className="flex items-start gap-3 p-4 md:p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted">Shipping address</p>
                  <p className="mt-1 whitespace-pre-line text-[0.95rem] leading-relaxed">
                    {order.address}
                    {"\n"}
                    {order.pincode} {order.city}, {order.state}
                    {"\n"}India
                  </p>
                </div>
                <button type="button" onClick={copyAddress} className="grid size-10 place-items-center rounded-full text-ink-soft hover:bg-sand" aria-label="Copy address for the courier" title="Copy address">
                  {copied ? <span className="text-xs font-semibold text-success">Copied</span> : <Icon name="copy" />}
                </button>
              </div>
              {order.notes && (
                <div className="p-4 md:p-5">
                  <p className="text-sm text-muted">Note from {first}</p>
                  <p className="mt-1 rounded-2xl bg-brass-soft/50 p-3 text-[0.95rem]">{order.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 p-4 md:p-5">
                <a href={wa} target="_blank" rel="noopener" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#e6f2ea] font-semibold text-[#17603c]">
                  <WhatsAppIcon className="size-5" /> <span className="hidden sm:inline">WhatsApp</span><span className="sm:hidden">Chat</span>
                </a>
                <a href={`tel:${order.phone}`} className="flex h-12 items-center justify-center gap-2 rounded-full bg-sand/70 font-semibold">
                  <Icon name="phone" /> Phone
                </a>
                {order.email ? (
                  <a href={`mailto:${order.email}`} className="flex h-12 items-center justify-center gap-2 rounded-full bg-sand/70 font-semibold">
                    <Icon name="mail" /> Email
                  </a>
                ) : (
                  <span className="flex h-12 items-center justify-center gap-2 rounded-full bg-sand/30 font-semibold text-muted/60" title="No email given">
                    <Icon name="mail" /> Email
                  </span>
                )}
              </div>
            </Card>
          </section>

          {/* Private notes */}
          <section>
            <SectionTitle title="Notes" />
            <Card className="p-4 md:p-5">
              <textarea
                id="notes"
                aria-label="Private notes"
                className="field min-h-24 !rounded-2xl"
                placeholder="Only you can see these notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {notes !== order.admin_notes && (
                <div className="mt-3">
                  <Secondary disabled={busy} onClick={() => update({ admin_notes: notes })}>Save notes</Secondary>
                </div>
              )}
            </Card>
          </section>

          {/* Timeline */}
          <section>
            <SectionTitle title="Timeline" />
            <ol className="relative ml-4 border-l border-line pb-2 pl-6">
              {events.map((e, n) => (
                <li key={e.key} className="relative pb-5">
                  {(n === 0 || events[n - 1].day !== e.day) && <p className="mb-3 text-sm text-muted">{e.day}</p>}
                  <span className="absolute -left-[1.94rem] mt-1 grid size-4 place-items-center rounded-full border border-line bg-paper">
                    <span className={`size-1.5 rounded-full ${n === 0 ? "bg-brass-deep" : "bg-muted/50"}`} />
                  </span>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[0.95rem] leading-relaxed">
                      {e.text}
                      {e.ref && <span className="block text-sm text-muted">{e.ref}</span>}
                    </p>
                    <span className="shrink-0 text-sm text-muted">{timeFmt.format(new Date(e.at))}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </AdminPage>
      </div>

      {/* More actions sheet */}
      {more && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 animate-[fade_0.15s_ease] md:items-center print:hidden" onClick={() => setMore(false)}>
          <div className="w-full max-w-md rounded-t-[2rem] bg-paper p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] md:rounded-[2rem]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="More actions">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line md:hidden" />
            <label className="label" htmlFor="setst">Set status by hand</label>
            <select id="setst" className="field !rounded-2xl" value={order.status} onChange={(e) => update({ status: e.target.value as OrderStatus })}>
              {[...ORDER_STEPS.map((s) => s.status), "cancelled" as const].map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              <SheetLink icon="copy" onClick={copyAddress}>{copied ? "Address copied ✓" : "Copy address for courier"}</SheetLink>
              <SheetLink icon="print" onClick={() => { setMore(false); setTimeout(print, 50); }}>Print packing slip</SheetLink>
              <SheetLink icon="external" href={`${SITE_URL}/order/${order.number}?k=${order.access_key}`}>Open customer&rsquo;s order page</SheetLink>
            </div>
            {order.status !== "cancelled" && (
              <button
                type="button"
                className="mt-4 h-12 w-full rounded-full border border-temple/40 font-semibold text-temple hover:bg-temple/5"
                disabled={busy}
                onClick={() => confirm(`Cancel order ${order.number}?`) && update({ status: "cancelled" })}
              >
                Cancel order
              </button>
            )}
            <button type="button" onClick={() => setMore(false)} className="mt-2 h-12 w-full rounded-full font-semibold text-muted">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Packing slip: only shows when printing */}
      <div className="hidden p-8 text-ink print:block">
        <div className="flex items-start justify-between border-b border-ink pb-4">
          <div>
            <BrandLogo tone="brass" className="block h-28 w-auto" />
            <p className="mt-1 text-xs">Handcrafted jewellery · {SITE_URL.replace(/^https?:\/\//, "")}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold">{order.number}</p>
            <p className="text-sm">{longFmt.format(new Date(order.created_at))}</p>
          </div>
        </div>
        <div className="mt-6 rounded border-2 border-ink p-5">
          <p className="text-xs font-semibold uppercase tracking-widest">Ship to</p>
          <p className="mt-2 whitespace-pre-line text-xl leading-snug">{address}</p>
        </div>
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.product_id} className="border-b border-line">
                <td className="py-2">{i.name} · {materialLabel(i.material)}</td>
                <td className="py-2 text-center">{i.qty}</td>
                <td className="py-2 text-right">{formatPrice(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-right font-semibold">Total {formatPrice(order.total)} · {paid ? "Paid by UPI" : "Payment pending"}</p>
        {settings.business_address && <p className="mt-10 whitespace-pre-line text-xs">From: {settings.legal_name || "Ansh Arte"}{"\n"}{settings.business_address}</p>}
        <p className="mt-4 text-xs">Thank you for shopping with Ansh Arte ♡</p>
      </div>
    </>
  );
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(d);
  return dayFmt.format(d);
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-[1.05rem] font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-ink-soft"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Action({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mt-5 border-t border-line pt-5">
      {children}
      {hint && <p className="mt-3 text-center text-sm text-muted">{hint}</p>}
    </div>
  );
}

function Primary({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="h-[3.25rem] w-full rounded-full bg-ink text-[1.02rem] font-semibold text-paper shadow-[0_6px_16px_rgba(33,27,26,0.18)] transition-colors hover:bg-ink-soft disabled:opacity-50">
      {children}
    </button>
  );
}

function Secondary({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="h-12 w-full rounded-full border border-line bg-ivory font-semibold transition-colors hover:bg-sand disabled:opacity-50">
      {children}
    </button>
  );
}

function SheetLink({ icon, children, href, onClick }: { icon: IconName; children: React.ReactNode; href?: string; onClick?: () => void }) {
  const cls = "flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-sand/50";
  return href ? (
    <a href={href} target="_blank" rel="noopener" className={cls}>
      <Icon name={icon} className="size-5 text-muted" /> {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      <Icon name={icon} className="size-5 text-muted" /> {children}
    </button>
  );
}
