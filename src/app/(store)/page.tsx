import Link from "next/link";
import { HeroSlider } from "@/components/hero-slider";
import { ShopTheLook, type LookItem } from "@/components/shop-the-look";
import { ArrowIcon, HandIcon, ShieldIcon, TruckIcon, WhatsAppIcon } from "@/components/icons";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import {
  artKind,
  categoryHref,
  collectionOf,
  getCatalogue,
  getProducts,
  getSettings,
  stylesOf,
  topCategories,
} from "@/lib/data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, formatPrice } from "@/lib/site";
import { festiveSlide, liveFestive } from "@/lib/festive";
import { LOOK } from "@/lib/looks";
import { samplePhoto } from "@/lib/samples";
import { HERO_SLIDES } from "@/lib/slides";
import type { Category } from "@/lib/types";

export default async function HomePage() {
  const [catalogue, settings, all] = await Promise.all([getCatalogue(), getSettings(), getProducts({ sort: "new" })]);
  const latest = all.slice(0, 8);

  // Styles first (Hoops, Jhumkas…), then top categories without styles (Rings)
  const tiles: Category[] = topCategories(catalogue).flatMap((c) => {
    const styles = stylesOf(catalogue, c.id);
    return styles.length ? styles : [c];
  });
  const spotlight = catalogue.collections.filter((c) => ["maharani", "mayuri", "halo", "celestial"].includes(c.slug));
  const showcase = (spotlight.length >= 3 ? spotlight : catalogue.collections).slice(0, 4);

  // Festive edit leads the banner while it is live
  const festive = liveFestive();
  const slides = festive ? [festiveSlide(festive), ...HERO_SLIDES.filter((s) => !s.href.startsWith("/collections"))] : HERO_SLIDES;

  // Shop the look: newest in-stock piece for each dot, preferring the same metal
  const used = new Set<string>();
  const lookItems: LookItem[] = LOOK.spots.flatMap((spot) => {
    const style = catalogue.categories.find((c) => c.slug === spot.style);
    if (!style) return [];
    const ids = [style.id, ...stylesOf(catalogue, style.id).map((s) => s.id)];
    const pool = all.filter((p) => ids.includes(p.category_id) && p.stock > 0 && !used.has(p.id));
    const p = pool.find((x) => !spot.material || x.material === spot.material) ?? pool[0];
    if (!p) return [];
    used.add(p.id);
    const collection = collectionOf(catalogue, p)?.name;
    return [
      {
        x: spot.x,
        y: spot.y,
        slug: p.slug,
        name: p.name,
        price: p.price,
        image: p.images[0]?.thumb ?? p.images[0]?.url ?? samplePhoto(artKind(catalogue, p), p.material),
        meta: [collection, style.name].filter(Boolean).join(" · "),
      },
    ];
  });

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+" + settings.whatsapp_number,
      contactType: "customer service",
      areaServed: "IN",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, "\\u003c") }}
      />

      <HeroSlider slides={slides} />

      {/* Shop by style */}
      <section className="border-y border-line bg-paper py-16 md:py-20">
        <div className="container-lux">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-3">Shop by style</p>
              <h2 className="heading-lg">Find your silhouette</h2>
            </div>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-6 md:px-0">
            {tiles.map((t) => (
              <Link
                key={t.id}
                href={categoryHref(catalogue, t)}
                className="group w-[42%] shrink-0 snap-start text-center md:w-auto"
              >
                <div className="overflow-hidden rounded-t-full border border-line bg-ivory">
                  <div className="aspect-[3/4]">
                    {t.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- category image
                      <img src={t.image_url} alt={t.name} loading="lazy" className="size-full object-cover" />
                    ) : (
                      <ProductArt
                        kind={t.slug}
                        material="oxidised-brass"
                        className="size-full transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                </div>
                <p className="mt-4 font-serif text-2xl">{t.name}</p>
                <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted group-hover:text-brass-deep">
                  Shop now
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-lux py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">Just in</p>
            <h2 className="heading-lg">New arrivals</h2>
          </div>
          <Link href="/earrings" className="link-underline hidden text-sm font-semibold uppercase tracking-[0.14em] md:inline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {latest.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              kind={artKind(catalogue, p)}
              collection={collectionOf(catalogue, p)?.name}
            />
          ))}
        </div>
      </section>

      {lookItems.length > 0 && (
        <ShopTheLook
          image={LOOK.image}
          alt={LOOK.alt}
          eyebrow={LOOK.eyebrow}
          title={LOOK.title}
          text={LOOK.text}
          items={lookItems}
        />
      )}

      {/* Collections */}
      <section className="bg-ink py-16 text-paper md:py-24">
        <div className="container-lux">
          <div className="mb-12 max-w-xl">
            <p className="eyebrow mb-3 text-brass-soft">Collections</p>
            <h2 className="heading-lg">Stories you can wear</h2>
            <p className="mt-4 text-paper/70">
              Each collection begins with a motif from India&rsquo;s craft heritage: peacocks, temple bells,
              mandalas and moons.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {showcase.map((c, i) => {
              const cat = catalogue.categories.find((x) => x.id === c.category_id);
              return (
                <Link
                  key={c.id}
                  href={`/collections/${c.slug}`}
                  className="group relative block overflow-hidden border border-paper/10"
                >
                  <div className="aspect-[4/5] bg-cocoa">
                    {c.banner_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- collection banner
                      <img src={c.banner_url} alt={c.name} loading="lazy" className="size-full object-cover opacity-80" />
                    ) : (
                      <ProductArt
                        kind={cat?.slug ?? "rings"}
                        material={i % 2 ? "german-silver" : "oxidised-brass"}
                        dark
                        className="size-full transition-transform duration-1000 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink via-ink/20 to-transparent p-4 md:p-6">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-brass-soft">
                      {cat?.name}
                    </p>
                    <h3 className="mt-1 font-serif text-2xl md:text-3xl">{c.name}</h3>
                    <p className="mt-1 hidden text-sm text-paper/70 sm:block">{c.tagline}</p>
                    <span className="mt-3 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brass-soft md:text-xs">
                      Discover <ArrowIcon />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link href="/collections" className="btn border border-paper/40 text-paper hover:bg-paper hover:text-ink">
              All collections
            </Link>
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="container-lux py-16 md:py-24" id="materials">
        <div className="mb-12 text-center">
          <p className="eyebrow mb-3">Our materials</p>
          <h2 className="heading-lg">Two metals, one soul</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: "Oxidised brass",
              text: "Warm, golden-toned brass darkened by hand to reveal every engraved line. Rich, festive and full of character.",
              href: "/earrings?material=oxidised-brass",
              m: "oxidised-brass" as const,
            },
            {
              title: "German silver",
              text: "A cool, silver-toned alloy of copper, nickel and zinc. Lightweight, durable and beautifully antique when oxidised.",
              href: "/earrings?material=german-silver",
              m: "german-silver" as const,
            },
          ].map((x) => (
            <Link key={x.title} href={x.href} className="group grid grid-cols-[40%_1fr] items-center gap-6 border border-line bg-paper p-4 md:p-6">
              <div className="overflow-hidden rounded-t-full">
                <ProductArt kind="jhumkas" material={x.m} className="aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="space-y-3">
                <h3 className="heading-md">{x.title}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{x.text}</p>
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brass-deep">
                  Shop {x.title.toLowerCase()} <ArrowIcon />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How to order */}
      <section className="border-y border-line bg-paper py-16 md:py-20">
        <div className="container-lux">
          <div className="mb-12 text-center">
            <p className="eyebrow mb-3">Simple & personal</p>
            <h2 className="heading-lg">How ordering works</h2>
          </div>
          <ol className="grid gap-10 md:grid-cols-3">
            {[
              ["Choose your pieces", "Add what you love to your bag and enter your delivery address."],
              ["Confirm on WhatsApp", "Your order arrives in our WhatsApp with one tap. We confirm availability personally."],
              ["Pay by UPI & relax", "Pay with GPay, PhonePe or any UPI app. Track your parcel right here."],
            ].map(([t, d], i) => (
              <li key={t} className="text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full border border-brass font-serif text-2xl text-brass-deep">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-serif text-2xl">{t}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Trust row */}
      <section className="container-lux py-14">
        <ul className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            [HandIcon, "Handcrafted", "Finished by hand"],
            [WhatsAppIcon, "Personal service", "Real people on WhatsApp"],
            [ShieldIcon, "Secure UPI", "Pay with any UPI app"],
            [TruckIcon, "Pan-India shipping", `Free above ${formatPrice(settings.free_shipping_above)}`],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof HandIcon;
            return (
              <li key={t as string} className="space-y-2">
                <I className="mx-auto size-7 text-brass" />
                <p className="text-sm font-semibold uppercase tracking-[0.14em]">{t as string}</p>
                <p className="text-sm text-muted">{d as string}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
