import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, TruckIcon, WhatsAppIcon } from "@/components/icons";
import { PayBox } from "@/components/pay-box";
import { getSettings } from "@/lib/data";
import { getPublicOrder } from "@/lib/orders";
import { SITE_URL, formatPrice, upiLink, whatsappLink } from "@/lib/site";
import { ORDER_STEPS, materialLabel } from "@/lib/types";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ number: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ number }, sp] = await Promise.all([params, searchParams]);
  const key = typeof sp.k === "string" ? sp.k : "";
  const [order, settings] = await Promise.all([getPublicOrder(number, key), getSettings()]);

  if (!order) {
    return (
      <div className="container-lux py-24 text-center">
        <h1 className="heading-lg">Order not found</h1>
        <p className="mt-4 text-ink-soft">Check the link we sent you on WhatsApp, or look it up with your phone number.</p>
        <Link href="/track" className="btn btn-primary mt-8">
          Track an order
        </Link>
      </div>
    );
  }

  const isNew = sp.new === "1";
  const link = `${SITE_URL}/order/${order.number}?k=${key}`;
  const message = [
    `Hello Ansh Arte! I'd like to place this order:`,
    ``,
    `*Order ${order.number}*`,
    ...order.items.map((i, n) => `${n + 1}. ${i.name} (${materialLabel(i.material)}) × ${i.qty} = ${formatPrice(i.price * i.qty)}`),
    ``,
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Shipping: ${order.shipping ? formatPrice(order.shipping) : "Free"}`,
    `*Total: ${formatPrice(order.total)}*`,
    ``,
    `Name: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}, ${order.city}, ${order.state} - ${order.pincode}`,
    ``,
    `Order link: ${link}`,
  ].join("\n");
  const wa = whatsappLink(settings.whatsapp_number, message);
  const cancelled = order.status === "cancelled";
  const stepIndex = ORDER_STEPS.findIndex((s) => s.status === order.status);
  const at = (s: string) => [...order.history].reverse().find((h) => h.status === s)?.at;
  const date = (iso?: string) =>
    iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso)) : "";

  return (
    <div className="container-lux max-w-4xl pb-10 pt-8 md:pt-12">
      <div className="mb-10 text-center">
        <p className="eyebrow mb-3">Order {order.number}</p>
        <h1 className="heading-lg">
          {cancelled
            ? "This order was cancelled"
            : order.status === "new"
              ? isNew
                ? "One last step"
                : "Waiting for confirmation"
              : ORDER_STEPS[stepIndex]?.customer}
        </h1>
        {order.status === "new" && (
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            Send your order to us on WhatsApp. We&rsquo;ll confirm availability and share payment details right away.
          </p>
        )}
      </div>

      {order.status === "new" && (
        <div className="mx-auto mb-12 max-w-md">
          <a href={wa} target="_blank" rel="noopener" className="btn btn-whatsapp w-full !min-h-14 text-[0.82rem]">
            <WhatsAppIcon className="size-5" /> Send order on WhatsApp
          </a>
          <p className="mt-3 text-center text-xs text-muted">Save this page to check your order status anytime.</p>
        </div>
      )}

      {!cancelled && (
        <ol className="mb-12 grid grid-cols-6 gap-1">
          {ORDER_STEPS.map((s, i) => {
            const done = i <= stepIndex;
            return (
              <li key={s.status} className="text-center">
                <div className={`h-1 ${done ? "bg-brass" : "bg-line"}`} />
                <span
                  className={`mx-auto -mt-2.5 grid size-4 place-items-center rounded-full ${done ? "bg-brass text-paper" : "border border-line bg-ivory"}`}
                >
                  {done && <CheckIcon className="size-2.5" />}
                </span>
                <p className={`mt-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] md:text-[0.68rem] ${done ? "text-ink" : "text-muted"}`}>
                  {s.label}
                </p>
                <p className="hidden text-[0.65rem] text-muted md:block">{date(at(s.status))}</p>
              </li>
            );
          })}
        </ol>
      )}

      {order.status === "confirmed" && (
        <section className="mb-10 border border-brass/40 bg-paper p-5 md:p-7">
          <p className="eyebrow mb-2">Payment</p>
          <h2 className="heading-md mb-5">Pay {formatPrice(order.total)} by UPI</h2>
          <PayBox
            upiLink={upiLink(settings, order.total, `Ansh Arte ${order.number}`)}
            upiId={settings.upi_id}
            gpayNumber={settings.gpay_number}
            amount={formatPrice(order.total)}
          />
          <a
            href={whatsappLink(settings.whatsapp_number, `Hi Ansh Arte! I've paid ${formatPrice(order.total)} for order ${order.number}. Sharing the screenshot here.`)}
            target="_blank"
            rel="noopener"
            className="btn btn-outline mt-6 w-full"
          >
            <WhatsAppIcon className="size-4" /> I&rsquo;ve paid: send screenshot
          </a>
        </section>
      )}

      {(order.status === "shipped" || order.status === "delivered") && order.tracking_number && (
        <section className="mb-10 flex flex-col gap-4 border border-line bg-paper p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div className="flex items-center gap-4">
            <TruckIcon className="size-8 text-brass" />
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">{order.courier || "Courier"}</p>
              <p className="font-serif text-2xl">{order.tracking_number}</p>
            </div>
          </div>
          {order.tracking_url && (
            <a href={order.tracking_url} target="_blank" rel="noopener" className="btn btn-primary">
              Track parcel
            </a>
          )}
        </section>
      )}

      <section className="grid gap-8 border-t border-line pt-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow mb-4">Items</p>
          <ul className="divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.product_id} className="flex justify-between gap-4 py-3">
                <div>
                  <Link href={`/product/${i.slug}`} className="font-serif text-lg">
                    {i.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {materialLabel(i.material)} · Qty {i.qty}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd>{order.shipping ? formatPrice(order.shipping) : "Free"}</dd>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="eyebrow mb-4">Delivering to</p>
          <p className="font-semibold">{order.customer_name}</p>
          <p className="text-sm leading-relaxed text-ink-soft">
            {order.address}
            <br />
            {order.city}, {order.state} {order.pincode}
            <br />
            {order.phone}
          </p>
          <a
            href={whatsappLink(settings.whatsapp_number, `Hi Ansh Arte! I have a question about order ${order.number}.`)}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brass-deep underline-offset-4 hover:underline"
          >
            <WhatsAppIcon className="size-4" /> Questions? Chat with us
          </a>
        </div>
      </section>
    </div>
  );
}
