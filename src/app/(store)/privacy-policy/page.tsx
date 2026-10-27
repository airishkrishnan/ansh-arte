import type { Metadata } from "next";
import Link from "next/link";
import { BusinessDetails, GrievanceOfficer } from "@/components/business-details";
import { ProsePage } from "@/components/prose-page";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Ansh Arte collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <ProsePage eyebrow="Policies" title="Privacy policy" path="/privacy-policy" intro="Last updated 27 October 2026">
      <p>
        This policy explains what personal information Ansh Arte collects when you use this website, why we collect
        it and what choices you have. It follows India&apos;s Digital Personal Data Protection Act, 2023 and the
        Information Technology Act, 2000.
      </p>

      <h2>Who we are</h2>
      <BusinessDetails settings={s} />

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>When you order:</strong> your name, phone number, delivery address, PIN code, email (if you give it)
          and any note you add.
        </li>
        <li>
          <strong>When you create an account:</strong> your email address, and your saved addresses and wishlist.
        </li>
        <li>
          <strong>When you write a review or ask to be told about a restock:</strong> your name, review and photo, or
          your phone number.
        </li>
        <li>
          <strong>When you pay:</strong> the last digits of your UPI reference, so we can match your payment. Payments
          happen in your own UPI app; we never see your bank details or UPI PIN.
        </li>
        <li>
          <strong>When you browse:</strong> anonymous usage data such as pages visited, device type and approximate
          location (city level), through website analytics. Your bag and recently viewed pieces are stored only in your
          own browser.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To confirm, pack and deliver your order, and to send you order and tracking updates by WhatsApp and email.</li>
        <li>To keep your account, order history, wishlist and saved addresses.</li>
        <li>To answer your questions, handle returns and refunds, and keep records the law asks us to keep.</li>
        <li>To understand which pages and pieces people like, so we can improve the store.</li>
      </ul>
      <p>We do not sell your personal information, and we do not send you marketing messages unless you ask for them.</p>

      <h2>Who we share it with</h2>
      <p>We share only what is needed with the services that help us run the store:</p>
      <ul>
        <li>Courier partners, who need your name, phone and address to deliver your parcel.</li>
        <li>Supabase (database and sign-in), Cloudflare (website hosting), Brevo (emails) and Google Analytics (visitor statistics).</li>
        <li>WhatsApp, when you choose to message us there.</li>
        <li>Government authorities, if the law requires it.</li>
      </ul>
      <p>Some of these services may store data on servers outside India, with safeguards as the law allows.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep order records for up to 8 years because tax and accounting laws require it. Account details are kept
        until you delete your account. Restock requests are deleted once we have told you.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>See, correct or update your details in your account under Profile & addresses, or ask us to do it.</li>
        <li>
          Delete your account any time from <Link href="/account/profile">Profile & addresses</Link>. Past orders stay
          in our records for the reason above.
        </li>
        <li>Withdraw your consent, or ask what data we hold about you, by contacting us.</li>
        <li>Block or clear cookies and site data in your browser settings.</li>
      </ul>

      <h2>Cookies and browser storage</h2>
      <p>
        We use your browser&apos;s storage to remember your bag, sign-in and recently viewed pieces. Google Analytics
        uses cookies to count visits. We do not use advertising cookies.
      </p>

      <h2>Security</h2>
      <p>
        Your data is sent over an encrypted connection and stored with access limited to Ansh Arte. Order pages need
        a private link, and signed-in customers can see only their own orders and addresses.
      </p>

      <h2>Children</h2>
      <p>This store is meant for adults. If you are under 18, please order with a parent or guardian.</p>

      <h2>Grievance officer</h2>
      <GrievanceOfficer settings={s} />

      <h2>Changes</h2>
      <p>If we change this policy, we will update the date at the top of this page.</p>
    </ProsePage>
  );
}
