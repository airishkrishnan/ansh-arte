import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { artKind, collectionOf, getCatalogue, getProducts } from "@/lib/data";
import { searchItems } from "@/lib/search";
import { toSearchItem } from "@/lib/search-index";

type Props = { searchParams: Promise<{ q?: string }> };

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const [catalogue, products] = await Promise.all([getCatalogue(), getProducts()]);
  const indexed = products.map((p) => ({ ...toSearchItem(catalogue, p), product: p }));
  const results = q ? searchItems(indexed, q).map((r) => r.product) : [];

  return (
    <div className="container-lux pb-10 pt-8 md:pt-12">
      <p className="eyebrow mb-3">Search</p>
      <h1 className="heading-lg mb-2">{q ? `“${q}”` : "Search our jewellery"}</h1>
      <p className="mb-10 text-sm text-muted">
        {q ? `${results.length} ${results.length === 1 ? "piece" : "pieces"} found` : "Use the search icon at the top to find a piece."}
      </p>
      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} kind={artKind(catalogue, p)} collection={collectionOf(catalogue, p)?.name} />
          ))}
        </div>
      ) : (
        q && (
          <p className="text-ink-soft">
            Try a style like jhumkas or hoops, or a metal like silver.{" "}
            <Link href="/collections" className="text-brass-deep underline underline-offset-4">
              Browse all collections
            </Link>
          </p>
        )
      )}
    </div>
  );
}
