import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <div className="container-lux pb-10 pt-8 md:pt-12">
      <h1 className="heading-lg mb-2">Checkout</h1>
      <p className="mb-10 text-sm text-ink-soft">
        No online payment needed now. You&rsquo;ll confirm the order with us on WhatsApp and pay by UPI after we
        confirm availability.
      </p>
      <CheckoutForm shippingFee={settings.shipping_fee} freeShippingAbove={settings.free_shipping_above} />
    </div>
  );
}
