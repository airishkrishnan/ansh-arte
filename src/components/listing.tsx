import Link from "next/link";
import { artKind, collectionOf, type Catalogue } from "@/lib/data";
import { MATERIALS, type Material, type Product } from "@/lib/types";
import { ProductCard } from "./product-card";
import { SortSelect } from "./sort-select";

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items, light = false }: { items: Crumb[]; light?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-xs ${light ? "text-brass-soft/70" : "text-muted"}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page" className={light ? "text-paper" : "text-ink-soft"}>
                {c.name}
              </span>
            ) : (
              <Link href={c.href} className={light ? "hover:text-paper" : "hover:text-ink"}>
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function breadcrumbJsonLd(items: Crumb[], base: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: base + c.href,
    })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Shared page body for category, style and collection pages. */
export function Listing({
  catalogue,
  crumbs,
  eyebrow,
  title,
  description,
  chips,
  products,
  basePath,
  material,
  sort,
  banner,
}: {
  catalogue: Catalogue;
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  description: string;
  chips: { name: string; href: string; current: boolean }[];
  products: Product[];
  basePath: string;
  material?: Material;
  sort?: string;
  /** Photo for the dark header band; without it the title sits on the page background */
  banner?: string;
}) {
  const q = (m?: Material) => {
    const p = new URLSearchParams();
    if (m) p.set("material", m);
    if (sort && sort !== "new") p.set("sort", sort);
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <>
      {banner && (
        <header className="relative isolate overflow-hidden bg-ink text-brass-soft">
          {/* eslint-disable-next-line @next/next/no-img-element -- banner photo */}
          <img
            src={banner}
            alt=""
            fetchPriority="high"
            className="hero-zoom absolute inset-0 -z-10 size-full object-cover object-[70%_center] opacity-85"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/65 to-ink/25 md:bg-gradient-to-r md:from-ink/90 md:via-ink/55 md:to-ink/5" />
          <div className="container-lux flex min-h-[20rem] flex-col pb-10 pt-6 md:min-h-[26rem] md:pb-16 md:pt-8">
            <Breadcrumbs items={crumbs} light />
            <div className="animate-rise mt-auto max-w-xl pt-14">
              <p className="eyebrow mb-3 !text-silver">{eyebrow}</p>
              <h1 className="heading-xl text-paper">{title}</h1>
              {description && <p className="mt-4 text-brass-soft/85 md:text-lg">{description}</p>}
            </div>
          </div>
        </header>
      )}
      <div className={`container-lux pb-8 ${banner ? "pt-8 md:pt-10" : "pt-6 md:pt-10"}`}>
        {!banner && (
          <>
            <Breadcrumbs items={crumbs} />
            <header className="mx-auto max-w-2xl py-10 text-center md:py-14">
              <p className="eyebrow mb-3">{eyebrow}</p>
              <h1 className="heading-xl">{title}</h1>
              {description && <p className="mt-5 text-ink-soft md:text-lg">{description}</p>}
            </header>
          </>
        )}

        {chips.length > 0 && (
          <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:justify-center md:px-0">
            {chips.map((c) => (
              <Link key={c.href} href={c.href} className="chip" aria-current={c.current}>
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <div className="sticky top-16 z-20 -mx-4 mb-8 flex items-center justify-between gap-3 border-y border-line bg-ivory/95 px-4 py-3 backdrop-blur md:top-20 md:mx-0 md:px-0">
          <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto pr-6 [mask-image:linear-gradient(to_right,black_80%,transparent)] md:pr-0 md:[mask-image:none]">
            <Link href={q()} className="chip !min-h-8 text-xs" aria-current={!material}>
              All metals
            </Link>
            {MATERIALS.map((m) => (
              <Link key={m.value} href={q(m.value)} className="chip !min-h-8 text-xs" aria-current={material === m.value}>
                {m.label}
              </Link>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">{products.length} pieces</span>
            <SortSelect value={sort ?? "new"} />
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-3xl">New pieces are on their way</p>
            <p className="mt-3 text-ink-soft">This edit is being handcrafted. Check back soon.</p>
            <Link href="/" className="btn btn-outline mt-8">
              Back to home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                kind={artKind(catalogue, p)}
                collection={collectionOf(catalogue, p)?.name}
                priority={i < 4}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export const parseMaterial = (v: unknown): Material | undefined =>
  v === "oxidised-brass" || v === "german-silver" ? v : undefined;

export const parseSort = (v: unknown) =>
  v === "price-asc" || v === "price-desc" ? v : ("new" as const);
