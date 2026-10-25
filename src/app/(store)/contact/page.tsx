import type { Metadata } from "next";
import { WhatsAppIcon } from "@/components/icons";
import { ProsePage } from "@/components/prose-page";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Chat with Ansh Arte on WhatsApp for orders, custom requests and questions.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const pretty = s.whatsapp_number.replace(/^91(\d{5})(\d{5})$/, "+91 $1 $2");
  return (
    <ProsePage
      eyebrow="We're here"
      title="Contact us"
      path="/contact"
      intro="The fastest way to reach us is WhatsApp. We usually reply within a few hours."
    >
      <div className="not-prose flex flex-col items-center gap-4 py-4 text-center">
        <a href={whatsappLink(s.whatsapp_number, "Hi Ansh Arte!")} target="_blank" rel="noopener" className="btn btn-whatsapp">
          <WhatsAppIcon className="size-4" /> Chat on WhatsApp
        </a>
        <p className="text-lg text-ink">{pretty}</p>
        {s.instagram && (
          <a href={`https://instagram.com/${s.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener" className="underline underline-offset-4">
            @{s.instagram.replace(/^@/, "")} on Instagram
          </a>
        )}
      </div>
    </ProsePage>
  );
}
