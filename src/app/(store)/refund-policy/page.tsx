import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Returns, refunds & cancellations",
  description: "Ansh Arte's policy on cancellations, damaged pieces, replacements and refunds.",
  alternates: { canonical: "/refund-policy" },
};

export default async function RefundPolicyPage() {
  const s = await getSettings();
  const wa = whatsappLink(s.whatsapp_number, "Hi Ansh Arte, I need help with my order ");
  return (
    <ProsePage
      eyebrow="Policies"
      title="Returns, refunds & cancellations"
      path="/refund-policy"
      intro="Last updated 27 October 2026"
    >
      <h2>Cancelling an order</h2>
      <ul>
        <li>You can cancel any time before your order is shipped. Message us on WhatsApp with your order number.</li>
        <li>If you have already paid, we refund the full amount, including shipping.</li>
        <li>Once an order has been shipped, it can no longer be cancelled.</li>
        <li>
          We may cancel an order if a piece is out of stock or we cannot deliver to your PIN code. We will tell you
          and refund anything you paid.
        </li>
      </ul>

      <h2>Damaged, wrong or missing pieces</h2>
      <ul>
        <li>
          Message us on <a href={wa} target="_blank" rel="noopener">WhatsApp</a> within <strong>48 hours of delivery</strong>{" "}
          with your order number and an unboxing video showing the parcel being opened.
        </li>
        <li>Once we have checked it, we send a replacement at no cost to you, or a full refund if a replacement is not available.</li>
        <li>If we need the piece back, we arrange the pickup or pay the return postage.</li>
      </ul>

      <h2>Change of mind</h2>
      <p>
        For hygiene reasons, jewellery cannot be returned or exchanged for a change of mind. If you are unsure about
        the size or look of a piece, message us before ordering and we will send you more photos or measurements.
      </p>

      <h2>What is not a defect</h2>
      <p>
        Each piece is handcrafted and oxidised by hand, so small variations in colour, finish and size are part of
        its character. Natural darkening over time is also normal; see our <Link href="/care-guide">care guide</Link>{" "}
        to keep your jewellery looking its best.
      </p>

      <h2>How refunds are paid</h2>
      <ul>
        <li>Refunds go back by UPI to the account you paid from, or to a UPI ID you give us.</li>
        <li>We send refunds within <strong>5 to 7 working days</strong> of approving them, and share the UPI reference with you.</li>
        <li>Shipping charges are refunded when the order is cancelled before shipping or the fault was ours.</li>
      </ul>

      <h2>Need help?</h2>
      <p>
        Reach us on WhatsApp or through our <Link href="/contact">contact page</Link>. For delivery times and
        charges, see <Link href="/shipping-returns">Shipping & returns</Link>.
      </p>
    </ProsePage>
  );
}
