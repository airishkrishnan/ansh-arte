import "server-only";
import { SITE_URL, formatPrice } from "./site";
import type { Order, OrderStatus, Settings } from "./types";

/** The order details an email needs. */
export type EmailOrder = Pick<
  Order,
  | "number"
  | "customer_name"
  | "email"
  | "address"
  | "city"
  | "state"
  | "pincode"
  | "items"
  | "subtotal"
  | "shipping"
  | "total"
  | "courier"
  | "tracking_number"
  | "tracking_url"
> & { key: string };

/** Statuses a customer gets an email for. "new" is the order-placed email. */
export const EMAIL_STATUSES: OrderStatus[] = ["new", "confirmed", "paid", "shipped", "delivered", "cancelled"];

export const emailConfigured = () => Boolean(process.env.BREVO_API_KEY && process.env.ORDER_EMAIL_FROM);

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Copy = { subject: string; heading: string; lines: string[]; button?: { label: string; href: string } };

function copyFor(o: EmailOrder, status: OrderStatus, s: Settings): Copy | null {
  const first = esc(o.customer_name.split(" ")[0]);
  const link = `${SITE_URL}/order/${encodeURIComponent(o.number)}?k=${o.key}`;
  const view = { label: "View your order", href: link };
  switch (status) {
    case "new":
      return {
        subject: `We've received your order ${o.number}`,
        heading: `Thank you, ${first}!`,
        lines: [
          `We've received your order <strong>${o.number}</strong>. We're checking availability and will confirm it on WhatsApp shortly.`,
          `Once it's confirmed, you can pay ${formatPrice(o.total)} by UPI (GPay, PhonePe, Paytm or any UPI app) from your order page.`,
        ],
        button: view,
      };
    case "confirmed":
      return {
        subject: `Order ${o.number} confirmed: pay ${formatPrice(o.total)} by UPI`,
        heading: `Your order is confirmed, ${first}`,
        lines: [
          `Your pieces are available and set aside for you. Pay <strong>${formatPrice(o.total)}</strong> by UPI from your order page to complete your order.`,
          `You can also pay to UPI ID <strong>${esc(s.upi_id)}</strong> and send us the screenshot on WhatsApp.`,
        ],
        button: { label: "Pay by UPI", href: link },
      };
    case "paid":
      return {
        subject: `Payment received for order ${o.number}`,
        heading: `Payment received. Thank you, ${first}!`,
        lines: [
          `We've received your payment of <strong>${formatPrice(o.total)}</strong> for order ${o.number}.`,
          "We'll pack it with care and email you the tracking details as soon as it ships.",
        ],
        button: view,
      };
    case "shipped": {
      const track = o.tracking_url || link;
      return {
        subject: `Your order ${o.number} is on its way`,
        heading: `It's on its way, ${first}!`,
        lines: [
          `Your order ${o.number} has been shipped${o.courier ? ` with <strong>${esc(o.courier)}</strong>` : ""}.`,
          ...(o.tracking_number ? [`Tracking number: <strong>${esc(o.tracking_number)}</strong>`] : []),
          "Delivery usually takes 3 to 7 working days.",
        ],
        button: { label: "Track your parcel", href: track },
      };
    }
    case "delivered":
      return {
        subject: `Your order ${o.number} has been delivered`,
        heading: `We hope you love it, ${first}`,
        lines: [
          `Your order ${o.number} has been delivered.`,
          "If anything arrived damaged, message us on WhatsApp within 48 hours with an unboxing video. And if you love your piece, we'd be so grateful for a quick review on the product page.",
        ],
        button: view,
      };
    case "cancelled":
      return {
        subject: `Your order ${o.number} has been cancelled`,
        heading: `Order ${o.number} cancelled`,
        lines: [
          `Hi ${first}, your order ${o.number} has been cancelled.`,
          "If you have already paid, we'll refund the full amount by UPI within 5 to 7 working days. Message us on WhatsApp with any questions.",
        ],
      };
    default:
      return null;
  }
}

function render(o: EmailOrder, c: Copy, s: Settings) {
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eadfd8">${esc(i.name)} × ${i.qty}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #eadfd8">${formatPrice(i.price * i.qty)}</td></tr>`,
    )
    .join("");
  const wa = `https://wa.me/${s.whatsapp_number.replace(/\D/g, "")}`;
  return `<!doctype html><html><body style="margin:0;background:#f4ece6;font-family:Poppins,Helvetica,Arial,sans-serif;color:#211b1a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4ece6"><tr><td align="center" style="padding:24px 12px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbf7f4;border:1px solid #eadfd8">
<tr><td align="center" style="background:#211b1a;padding:18px 28px"><img src="${SITE_URL}/brand/logo-silver-dark.png" width="120" height="109" alt="Ansh Arte" style="display:block;border:0;color:#e8d8ce;font-family:Georgia,serif;font-size:20px;letter-spacing:4px"></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-family:Lora,Georgia,serif;font-weight:normal;font-size:26px">${c.heading}</h1>
${c.lines.map((l) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#382a28">${l}</p>`).join("")}
${c.button ? `<p style="margin:24px 0"><a href="${c.button.href}" style="display:inline-block;background:#60433d;color:#e8d8ce;text-decoration:none;padding:12px 24px;font-size:13px;letter-spacing:2px;text-transform:uppercase">${c.button.label}</a></p>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:14px">
<tr><td colspan="2" style="padding-bottom:4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#916b60">Order ${o.number}</td></tr>
${rows}
<tr><td style="padding:8px 0;color:#382a28">Shipping</td><td align="right" style="padding:8px 0">${o.shipping ? formatPrice(o.shipping) : "Free"}</td></tr>
<tr><td style="padding:8px 0;font-weight:bold">Total</td><td align="right" style="padding:8px 0;font-weight:bold">${formatPrice(o.total)}</td></tr>
</table>
<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#382a28"><strong>Delivering to</strong><br>${esc(o.customer_name)}<br>${esc(o.address)}<br>${esc(o.city)}, ${esc(o.state)} ${esc(o.pincode)}</p>
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #eadfd8;font-size:12px;line-height:1.6;color:#7a6a66">
Questions? Reply to this email or <a href="${wa}" style="color:#60433d">message us on WhatsApp</a>.<br>
<a href="${SITE_URL}" style="color:#60433d">${SITE_URL.replace(/^https?:\/\//, "")}</a>${s.legal_name ? ` · ${esc(s.legal_name)}` : ""}${s.business_address ? `<br>${esc(s.business_address).replace(/\n/g, ", ")}` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

/**
 * Emails the customer about their order through Brevo. Returns true when the
 * email was accepted. Never throws: an order must not fail because an email did.
 */
export async function sendOrderEmail(o: EmailOrder, status: OrderStatus, settings: Settings): Promise<boolean> {
  const key = process.env.BREVO_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  const to = o.email?.trim();
  if (!key || !from || !to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return false;
  const copy = copyFor(o, status, settings);
  if (!copy) return false;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Ansh Arte", email: from },
        to: [{ email: to, name: o.customer_name }],
        ...(settings.support_email ? { replyTo: { email: settings.support_email, name: "Ansh Arte" } } : {}),
        subject: copy.subject,
        htmlContent: render(o, copy, settings),
      }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
