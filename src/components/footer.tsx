import Link from "next/link";
import { whatsappLink } from "@/lib/site";
import type { Settings } from "@/lib/types";
import { Logo, Monogram, type NavItem } from "./header";
import { InstagramIcon, WhatsAppIcon } from "./icons";

export function Footer({ nav, settings }: { nav: NavItem[]; settings: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-ink text-paper/80">
      <div className="container-lux grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-5">
          <div className="flex items-end gap-4">
            <Monogram className="h-14 w-11 text-silver" letter="var(--color-brass-soft)" />
            <Logo className="text-3xl text-paper" accent="text-silver" />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-paper/60">
            Oxidised brass and German silver jewellery, handcrafted with an Indian heritage soul.
          </p>
          <div className="flex gap-3">
            <a
              href={whatsappLink(settings.whatsapp_number, "Hi Ansh Arte!")}
              target="_blank"
              rel="noopener"
              className="grid size-10 place-items-center rounded-full border border-paper/20 hover:border-brass hover:text-brass"
              aria-label="Chat on WhatsApp"
            >
              <WhatsAppIcon />
            </a>
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener"
                className="grid size-10 place-items-center rounded-full border border-paper/20 hover:border-brass hover:text-brass"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
            )}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-4 text-brass-soft">Shop</p>
          <ul className="space-y-2.5 text-sm">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-paper">
                  {n.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/collections" className="hover:text-paper">
                All collections
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 text-brass-soft">Help</p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/track" className="hover:text-paper">
                Track your order
              </Link>
            </li>
            <li>
              <Link href="/shipping-returns" className="hover:text-paper">
                Shipping & returns
              </Link>
            </li>
            <li>
              <Link href="/care-guide" className="hover:text-paper">
                Jewellery care
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-paper">
                Contact us
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 text-brass-soft">Ansh Arte</p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/about" className="hover:text-paper">
                Our craft
              </Link>
            </li>
            <li>
              <Link href="/about#materials" className="hover:text-paper">
                Brass vs German silver
              </Link>
            </li>
          </ul>
          <p className="eyebrow mb-4 mt-8 text-brass-soft">Policies</p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/refund-policy" className="hover:text-paper">
                Returns & refunds
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-paper">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-paper">
                Terms of use
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-lux flex flex-col gap-2 py-6 text-xs text-paper/50 md:flex-row md:justify-between">
          <div className="space-y-1">
            <p>© {year} Ansh Arte. Handcrafted in India.</p>
            {(settings.legal_name || settings.business_address) && (
              <p>{[settings.legal_name, settings.business_address.replace(/\s*\n\s*/g, ", ")].filter(Boolean).join(" · ")}</p>
            )}
            {(settings.support_email || settings.gstin) && (
              <p>
                {settings.support_email && <a href={`mailto:${settings.support_email}`} className="hover:text-paper">{settings.support_email}</a>}
                {settings.support_email && settings.gstin && " · "}
                {settings.gstin && `GSTIN ${settings.gstin}`}
              </p>
            )}
          </div>
          <p>Orders confirmed on WhatsApp · Payments by UPI</p>
        </div>
      </div>
    </footer>
  );
}
