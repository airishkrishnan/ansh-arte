import Link from "next/link";
import { formatPrice } from "@/lib/site";
import { materialLabel, type Product } from "@/lib/types";
import { ProductImage } from "./product-image";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({
  product,
  kind,
  collection,
  priority = false,
}: {
  product: Product;
  kind: string;
  collection?: string;
  priority?: boolean;
}) {
  const soldOut = product.stock === 0;
  const onSale = product.compare_at_price && product.compare_at_price > product.price;
  const [first, second] = product.images;

  return (
    <div className="relative" data-reveal>
    <Link href={`/product/${product.slug}`} className="group block" prefetch={false}>
      <div className="relative">
        <ProductImage
          image={first}
          alt={product.name}
          kind={kind}
          material={product.material}
          priority={priority}
          thumb
          className="transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-[1.015]"
        />
        {second && (
          // eslint-disable-next-line @next/next/no-img-element -- second photo revealed on hover
          <img
            src={second.thumb ?? second.url}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {soldOut && (
            <span className="bg-paper/90 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              Sold out
            </span>
          )}
          {!soldOut && onSale && (
            <span className="bg-temple px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-paper">
              Sale
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted">
          {collection ? `${collection} · ` : ""}
          {materialLabel(product.material)}
        </p>
        <h3 className="font-serif text-lg leading-snug text-ink md:text-xl">{product.name}</h3>
        <p className="flex items-baseline gap-2 text-sm">
          <span className={soldOut ? "text-muted" : "font-semibold text-ink"}>
            {formatPrice(product.price)}
          </span>
          {onSale && (
            <span className="text-muted line-through">{formatPrice(product.compare_at_price!)}</span>
          )}
        </p>
      </div>
    </Link>
      <div className="absolute right-2 top-2">
        <WishlistButton productId={product.id} name={product.name} />
      </div>
    </div>
  );
}
