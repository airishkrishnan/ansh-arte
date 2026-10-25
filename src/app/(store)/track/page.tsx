import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your Ansh Arte order and courier tracking.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <div className="container-lux max-w-md py-16 md:py-24">
      <p className="eyebrow mb-3 text-center">Order status</p>
      <h1 className="heading-lg mb-4 text-center">Track your order</h1>
      <p className="mb-10 text-center text-sm text-ink-soft">
        Enter your order number (for example AA-1001) and the WhatsApp number you used at checkout.
      </p>
      <TrackForm />
    </div>
  );
}
