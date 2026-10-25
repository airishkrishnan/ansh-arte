import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { getSettings } from "@/lib/data";
import { formatPrice } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description: "Ansh Arte ships across India. Read about delivery times, shipping charges, payments and exchanges.",
  alternates: { canonical: "/shipping-returns" },
};

export default async function ShippingPage() {
  const s = await getSettings();
  return (
    <ProsePage eyebrow="Help" title="Shipping & returns" path="/shipping-returns">
      <h2>How ordering works</h2>
      <p>
        Place your order on this website and send it to us on WhatsApp in one tap. We confirm availability, you pay
        by UPI (GPay, PhonePe, Paytm or any UPI app), and we pack and ship your order.
      </p>
      <h2>Shipping</h2>
      <ul>
        <li>We ship across India.</li>
        <li>
          Shipping is <strong>free on orders above {formatPrice(s.free_shipping_above)}</strong>, otherwise{" "}
          {formatPrice(s.shipping_fee)} per order.
        </li>
        <li>Orders are dispatched within 2 to 4 working days after payment.</li>
        <li>Delivery usually takes 3 to 7 working days, depending on your location.</li>
        <li>You get the courier name and tracking number on WhatsApp and on your order page.</li>
      </ul>
      <h2>Exchanges and returns</h2>
      <ul>
        <li>If your piece arrives damaged, message us on WhatsApp within 48 hours of delivery with an unboxing video.</li>
        <li>We will replace it, or refund you by UPI if a replacement is not available.</li>
        <li>For hygiene reasons, earrings cannot be returned for a change of mind.</li>
        <li>Slight variations in colour and finish are part of handcrafted, oxidised jewellery and are not defects.</li>
      </ul>
      <h2>Cancellations</h2>
      <p>You can cancel any time before your order is shipped. If you have already paid, we refund the full amount by UPI.</p>
    </ProsePage>
  );
}
