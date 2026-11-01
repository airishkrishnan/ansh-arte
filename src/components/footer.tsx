import Link from "next/link";
import { formatPrice, whatsappLink } from "@/lib/site";
import type { Settings } from "@/lib/types";
import { BrandLogo } from "./brand";
import type { NavItem } from "./header";
import { ArrowIcon, HandIcon, InstagramIcon, ShieldIcon, TruckIcon, WhatsAppIcon } from "./icons";

/** A recent piece shown in the footer photo strip */
export type StripItem = { slug: string; name: string; image: string | null };

export function Footer({ nav, settings, strip }: { nav: NavItem[]; settings: Settings; strip: StripItem[] }) {
  const year = new Date().getFullYear();
  const handle = settings.instagram.replace(/^@/, "");
  const photos = strip.filter((s): s is StripItem & { image: string } => !!s.image);
  const badges = [
    { Icon: HandIcon, title: "Handcrafted in India", text: "Every piece finished by hand" },
    { Icon: ShieldIcon, title: "Secure UPI payments", text: "GPay, PhonePe or any UPI app" },
    { Icon: TruckIcon, title: "Free shipping", text: `On orders above ${formatPrice(settings.free_shipping_above)}` },
    { Icon: WhatsAppIcon, title: "Confirmed personally", text: "A real person checks every order" },
  ];

  return (
    <footer className="mt-24 bg-ink text-paper/80">
      {photos.length >= 3 && (
        <div className="container-lux pt-16 md:pt-20" data-reveal>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2 !text-silver">From the studio</p>
              <h2 className="font-serif text-3xl text-paper md:text-4xl">Fresh off the workbench</h2>
            </div>
            {handle && (
              <a
                href={`https://instagram.com/${handle}`}
                target="_blank"
                rel="noopener"
                className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brass-soft hover:text-paper"
              >
                <InstagramIcon className="size-4" />
                <span className="hidden sm:inline">Follow</span> @{handle}
              </a>
            )}
          </div>
          <ul className="grid grid-cols-3 gap-1.5 md:grid-cols-6 md:gap-2">
            {photos.slice(0, 6).map((p) => (
              <li key={p.slug}>
                <Link href={`/product/${p.slug}`} className="shimmer group block aspect-square overflow-hidden bg-ink-soft" prefetch={false}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnail */}
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    data-fade
                    className="size-full object-cover opacity-90 transition-[opacity,transform] duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="container-lux grid gap-6 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-center md:gap-10 md:py-16">
        <div className="rounded-sm border border-paper/15 bg-ink-soft p-6 md:p-8" data-reveal>
          <span className="grid size-11 place-items-center rounded-full bg-[#1f7a4d] text-white">
            <WhatsAppIcon />
          </span>
          <h2 className="mt-4 font-serif text-2xl text-paper md:text-3xl">Need help choosing?</h2>
          <p className="mt-2 text-sm leading-relaxed text-paper/65">
            Send us a photo of your outfit and we&rsquo;ll suggest pieces to go with it. You chat with a real
            person, not a bot.
          </p>
          <a
            href={whatsappLink(settings.whatsapp_number, "Hi Ansh Arte! Could you help me choose a piece?")}
            target="_blank"
            rel="noopener"
            className="btn btn-whatsapp mt-5 w-full sm:w-auto"
          >
            Chat with us <ArrowIcon />
          </a>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8" data-reveal>
          {badges.map(({ Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-silver/40 text-silver">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-paper">{title}</p>
                <p className="mt-0.5 text-sm text-paper/60">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="container-lux grid gap-12 border-t border-paper/10 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-5">
          <BrandLogo tone="silver-dark" className="h-auto w-[300px] max-w-full" />
          {/* Brand line (guidelines p.13): a sign-off, never locked into the logo */}
          <p className="subhead text-brass-soft">a piece of art.</p>
          <p className="max-w-xs text-sm leading-relaxed text-paper/60">
            Oxidised brass and German silver jewellery, made slowly, by hand.
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
            {handle && (
              <a
                href={`https://instagram.com/${handle}`}
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
