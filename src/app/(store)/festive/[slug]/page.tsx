import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { artKind, collectionOf, getCatalogue, getProducts } from "@/lib/data";
import { FESTIVE, isLive } from "@/lib/festive";
import { formatPrice } from "@/lib/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = FESTIVE.find((x) => x.slug === slug);
  if (!f) return {};
  return { title: f.name, description: f.story, alternates: { canonical: `/festive/${f.slug}` } };
}

export default async function FestivePage({ params, searchParams }: Props) {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  const f = FESTIVE.find((x) => x.slug === slug);
  if (!f || (!isLive(f) && !preview)) notFound();

  const [catalogue, products] = await Promise.all([getCatalogue(), getProducts({ sort: "new" })]);
  const inStock = products.filter((p) => p.stock > 0);
  const gifts = f.giftsUnder ? inStock.filter((p) => p.price < f.giftsUnder!).slice(0, 8) : [];
  const card = (p: (typeof products)[number]) => (
    <ProductCard key={p.id} product={p} kind={artKind(catalogue, p)} collection={collectionOf(catalogue, p)?.name} />
  );

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-brass-soft">
        {/* eslint-disable-next-line @next/next/no-img-element -- festive banner */}
        <img src={f.slide.image} alt={f.slide.alt} className="absolute inset-0 -z-10 size-full object-cover object-[72%_center] md:object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/10 md:bg-gradient-to-r md:from-ink/90 md:via-ink/50 md:to-transparent" />
        <div className="container-lux flex min-h-[26rem] items-end py-12 md:min-h-[32rem] md:items-center">
          <div className="max-w-xl space-y-5">
            <p className="eyebrow !text-silver">{f.slide.eyebrow}</p>
            <h1 className="heading-xl text-balance">{f.name}</h1>
            <p className="max-w-md leading-relaxed text-brass-soft/85">{f.story}</p>
            {!isLive(f) && (
              <p className="inline-block bg-brass-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink">
                Preview · goes live {f.start}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="container-lux pb-10">
        {gifts.length > 0 && (
          <section className="pt-16 md:pt-20">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow mb-3">Easy gifting</p>
                <h2 className="heading-lg">Gifts under {formatPrice(f.giftsUnder!)}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6">{gifts.map(card)}</div>
          </section>
        )}

        <section className="pt-16 md:pt-20">
          <div className="mb-10">
            <p className="eyebrow mb-3">{f.slide.eyebrow}</p>
            <h2 className="heading-lg">The full edit</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6">{inStock.map(card)}</div>
          <div className="mt-12 text-center">
            <Link href="/collections" className="btn btn-outline">
              Explore all collections <ArrowIcon />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
