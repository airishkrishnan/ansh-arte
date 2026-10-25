"use client";

import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "./icons";

/** Small chat button. Hidden on phones on product pages, which have their own WhatsApp button. */
export function WhatsAppFloat({ number }: { number: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout") || pathname.startsWith("/order")) return null;
  const onProduct = pathname.startsWith("/product/");
  return (
    <a
      href={whatsappLink(number, "Hi Ansh Arte! I have a question.")}
      target="_blank"
      rel="noopener"
      aria-label="Chat with us on WhatsApp"
      className={`fixed bottom-5 right-4 z-30 size-12 place-items-center rounded-full bg-[#1f7a4d] text-white shadow-lg transition-transform hover:scale-105 md:bottom-6 md:right-6 md:grid ${
        onProduct ? "hidden" : "grid"
      }`}
    >
      <WhatsAppIcon className="size-6" />
    </a>
  );
}
