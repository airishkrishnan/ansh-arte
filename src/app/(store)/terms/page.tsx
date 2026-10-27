import type { Metadata } from "next";
import Link from "next/link";
import { BusinessDetails, GrievanceOfficer } from "@/components/business-details";
import { ProsePage } from "@/components/prose-page";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for buying from Ansh Arte and using this website.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <ProsePage eyebrow="Policies" title="Terms of use" path="/terms" intro="Last updated 27 October 2026">
      <p>
        These terms apply when you use this website or buy from Ansh Arte. By placing an order you agree to them,
        together with our <Link href="/privacy-policy">privacy policy</Link> and{" "}
        <Link href="/refund-policy">returns, refunds & cancellations policy</Link>.
      </p>

      <h2>The seller</h2>
      <BusinessDetails settings={s} />

      <h2>Our jewellery</h2>
      <ul>
        <li>
          Our pieces are oxidised brass and German silver (an alloy of copper, nickel and zinc). They are fashion
          jewellery and contain no gold or sterling silver unless the product page says so.
        </li>
        <li>
          Every piece is handmade, so colour, finish and size can differ slightly from the photos. Screens also show
          colours differently.
        </li>
        <li>If you have a metal allergy, please check the materials on the product page before ordering.</li>
      </ul>

      <h2>Prices and payment</h2>
      <ul>
        <li>All prices are in Indian rupees and include all taxes. Shipping is shown separately before you order.</li>
        <li>
          After you place an order we confirm it on WhatsApp, and you pay by UPI (GPay, PhonePe, Paytm or any UPI
          app). Your order is reserved once payment is received.
        </li>
        <li>
          If a price on the site is clearly wrong because of a mistake, we will tell you before you pay and you can
          choose to continue or cancel.
        </li>
      </ul>

      <h2>Orders</h2>
      <ul>
        <li>An order is accepted when we confirm it. We may decline an order if a piece is out of stock or we cannot deliver to your address.</li>
        <li>Please give a correct phone number and full address. We are not responsible for delays caused by wrong details.</li>
        <li>
          Delivery times, cancellations, returns and refunds are explained in{" "}
          <Link href="/shipping-returns">Shipping & returns</Link> and our{" "}
          <Link href="/refund-policy">refund policy</Link>.
        </li>
      </ul>

      <h2>Your account</h2>
      <p>
        Keep access to your email safe, because sign-in codes are sent there. You can delete your account at any time
        from Profile & addresses.
      </p>

      <h2>Reviews</h2>
      <p>
        Reviews and photos you post must be your own and honest. We may remove reviews that are offensive, misleading
        or not about the product. By posting, you let us show your review and photo on this website and our social
        pages.
      </p>

      <h2>Our content</h2>
      <p>
        The designs, photos, text and logo on this website belong to Ansh Arte. Please do not copy or reuse them
        without our written permission.
      </p>

      <h2>Liability</h2>
      <p>
        We do our best to describe our pieces accurately and deliver on time. To the extent the law allows, our
        responsibility for any order is limited to the amount you paid for it. Nothing in these terms takes away your
        rights under the Consumer Protection Act, 2019.
      </p>

      <h2>Complaints</h2>
      <GrievanceOfficer settings={s} />

      <h2>Law</h2>
      <p>
        These terms are governed by the laws of India. Any dispute is subject to the courts where Ansh Arte is
        based{s.business_address ? `, as given in the address above` : ""}.
      </p>
    </ProsePage>
  );
}
