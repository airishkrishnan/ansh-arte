import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToBag } from "@/components/add-to-bag";
import { Gallery } from "@/components/gallery";
import { HandIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { Breadcrumbs, JsonLd, breadcrumbJsonLd } from "@/components/listing";
import { ProductCard } from "@/components/product-card";
import { Reviews, Stars, averageRating } from "@/components/reviews";
import {
  artKind,
  categoryHref,
  categoryPath,
  collectionOf,
  getCatalogue,
  getProduct,
  getProducts,
  getReviews,
  getSettings,
} from "@/lib/data";
import { SITE_NAME, SITE_URL, formatPrice } from "@/lib/site";
import { materialLabel } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const title = `${product.name}, ${materialLabel(product.material)}`;
  const description =
    product.description.slice(0, 155) ||
    `${product.name} handcrafted in ${materialLabel(product.material).toLowerCase()} by Ansh Arte. ${formatPrice(product.price)}.`;
  const url = `/product/${product.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${product.name} · ${formatPrice(product.price)}`,
      description,
      url,
      images: product.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt || product.name })),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, catalogue, settings] = await Promise.all([getProduct(slug), getCatalogue(), getSettings()]);
  if (!product) notFound();

  const reviews = await getReviews(product.id);
  const rating = averageRating(reviews);
  const kind = artKind(catalogue, product);
  const collection = collectionOf(catalogue, product);
  const path = categoryPath(catalogue, product.category_id);
  const related = await getProducts(
    collection
      ? { collectionId: collection.id, excludeId: product.id, limit: 4 }
      : { categoryIds: [product.category_id], excludeId: product.id, limit: 4 },
  );
  const more =
    related.length < 4
      ? (await getProducts({ categoryIds: [product.category_id], excludeId: product.id, limit: 8 }))
          .filter((p) => !related.some((r) => r.id === p.id))
          .slice(0, 4 - related.length)
      : [];
  // Pairs well with: other styles in the same metal, same collection first
  const shown = new Set([product.id, ...related.map((p) => p.id), ...more.map((p) => p.id)]);
  const pairs = (await getProducts({ material: product.material, limit: 40 }))
    .filter((p) => p.category_id !== product.category_id && !shown.has(p.id) && p.stock > 0)
    .sort((a, b) => Number(b.collection_id === product.collection_id) - Number(a.collection_id === product.collection_id))
    .slice(0, 4);
  const url = `${SITE_URL}/product/${product.slug}`;
  const crumbs = [
    { name: "Home", href: "/" },
    ...path.map((c) => ({ name: c.name, href: categoryHref(catalogue, c) })),
    { name: product.name, href: `/product/${product.slug}` },
  ];
  const onSale = product.compare_at_price && product.compare_at_price > product.price;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    material: materialLabel(product.material),
    category: path.map((c) => c.name).join(" > "),
    ...(reviews.length
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: rating.toFixed(1), reviewCount: reviews.length },
          review: reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.name },
            reviewRating: { "@type": "Rating", ratingValue: r.rating },
            reviewBody: r.body,
          })),
        }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
        shippingRate: { "@type": "MonetaryAmount", value: product.price >= settings.free_shipping_above ? 0 : settings.shipping_fee, currency: "INR" },
      },
    },
  };

  const details = product.details
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(":");
      return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ["", l];
    });

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE_URL)} />
      <div className="container-lux pb-10 pt-4 md:pt-8">
        <div className="mb-5">
          <Breadcrumbs items={crumbs} />
        </div>
        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-14">
          <div className="-mx-4 md:mx-0">
            <div className="md:sticky md:top-24">
              <Gallery images={product.images} name={product.name} kind={kind} material={product.material} />
            </div>
          </div>

          <div className="space-y-7">
            <div className="space-y-3">
              <p className="eyebrow">
                {collection ? (
                  <Link href={`/collections/${collection.slug}`} className="hover:text-ink">
                    {collection.name} collection
                  </Link>
                ) : (
                  path.at(-1)?.name
                )}
              </p>
              <h1 className="heading-lg">{product.name}</h1>
              {reviews.length > 0 && (
                <a href="#reviews" className="flex items-center gap-2 text-xs text-ink-soft hover:text-ink">
                  <Stars rating={rating} />
                  {rating.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </a>
              )}
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl">{formatPrice(product.price)}</span>
                {onSale && (
                  <>
                    <span className="text-lg text-muted line-through">{formatPrice(product.compare_at_price!)}</span>
                    <span className="bg-temple px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-paper">
                      Save {formatPrice(product.compare_at_price! - product.price)}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted">Inclusive of all taxes · Shipping calculated at checkout</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="chip !cursor-default !min-h-8 border-brass/40 bg-brass-soft/40 text-xs">
                {materialLabel(product.material)}
              </span>
              {path.at(-1) && (
                <Link href={categoryHref(catalogue, path.at(-1)!)} className="chip !min-h-8 text-xs">
                  {path.at(-1)!.name}
                </Link>
              )}
            </div>

            <AddToBag product={product} kind={kind} whatsapp={settings.whatsapp_number} productUrl={url} />

            <ul className="grid grid-cols-3 gap-3 border-y border-line py-5 text-center text-[0.7rem] uppercase tracking-[0.12em] text-ink-soft">
              <li className="space-y-2">
                <HandIcon className="mx-auto size-5 text-brass" />
                <span className="block">Handcrafted</span>
              </li>
              <li className="space-y-2">
                <ShieldIcon className="mx-auto size-5 text-brass" />
                <span className="block">Secure UPI</span>
              </li>
              <li className="space-y-2">
                <TruckIcon className="mx-auto size-5 text-brass" />
                <span className="block">
                  Free over {formatPrice(settings.free_shipping_above)}
                </span>
              </li>
            </ul>

            {product.description && (
              <div className="space-y-3">
                <h2 className="label">Description</h2>
                <p className="whitespace-pre-line leading-relaxed text-ink-soft">{product.description}</p>
              </div>
            )}

            <div className="divide-y divide-line border-y border-line">
              {details.length > 0 && (
                <details className="group py-4" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[0.14em]">
                    Details
                    <span className="text-lg transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                    <dt className="text-muted">Material</dt>
                    <dd>{materialLabel(product.material)}</dd>
                    {details.map(([k, v], i) => (
                      <div key={i} className="contents">
                        <dt className="text-muted">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[0.14em]">
                  Care
                  <span className="text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {product.care ||
                    "Store in an airtight pouch, away from moisture. Wipe gently with a soft dry cloth after each wear. Keep away from perfume, water and lotions."}{" "}
                  <Link href="/care-guide" className="underline underline-offset-4">
                    Full care guide
                  </Link>
                </p>
              </details>
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[0.14em]">
                  Ordering & shipping
                  <span className="text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  Place your order here and send it to us on WhatsApp in one tap. We confirm availability, you pay
                  by UPI, and we ship across India within 2 to 4 working days. Shipping is free on orders above{" "}
                  {formatPrice(settings.free_shipping_above)}.{" "}
                  <Link href="/shipping-returns" className="underline underline-offset-4">
                    Shipping & returns
                  </Link>
                </p>
              </details>
            </div>
          </div>
        </div>

        <Reviews reviews={reviews} productId={product.id} productName={product.name} />

        {pairs.length > 0 && (
          <section className="mt-20 md:mt-28">
            <div className="mb-10 text-center">
              <p className="eyebrow mb-3">Complete the look</p>
              <h2 className="heading-lg">Pairs well with</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6">
              {pairs.map((p) => (
                <ProductCard key={p.id} product={p} kind={artKind(catalogue, p)} collection={collectionOf(catalogue, p)?.name} />
              ))}
            </div>
          </section>
        )}

        {related.length + more.length > 0 && (
          <section className="mt-20 md:mt-28">
            <h2 className="heading-lg mb-10 text-center">You may also love</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6">
              {[...related, ...more].map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  kind={artKind(catalogue, p)}
                  collection={collectionOf(catalogue, p)?.name}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
