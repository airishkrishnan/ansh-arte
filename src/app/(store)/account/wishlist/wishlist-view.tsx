"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/account";
import { useCart } from "@/components/cart";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

type Item = { product: Product; kind: string; collection?: string };

export function WishlistView() {
  const { wishlist, user, enabled } = useAccount();
  const { add } = useCart();
  const [items, setItems] = useState<Item[] | null>(null);
  const ids = wishlist.join(",");

  // Fetch product details for the saved ids. Removing a heart just filters the
  // list locally, so only newly added ids trigger a fetch.
  useEffect(() => {
    if (!ids) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to fetch
      setItems([]);
      return;
    }
    let live = true;
    fetch(`/api/products?ids=${encodeURIComponent(ids)}`)
      .then((r) => r.json())
      .then((d) => live && setItems(d.products ?? []))
      .catch(() => live && setItems([]));
    return () => {
      live = false;
    };
  }, [ids]);

  if (!items) return <p className="py-16 text-center text-sm text-muted">Loading your wishlist…</p>;

  const shown = items.filter((i) => wishlist.includes(i.product.id));

  return (
    <>
      {!user && enabled && (
        <p className="mx-auto mb-10 max-w-xl border border-line bg-paper px-4 py-3 text-center text-sm text-ink-soft">
          Your wishlist is saved on this device.{" "}
          <Link href="/account/login?next=/account/wishlist" className="font-semibold text-brass-deep underline underline-offset-4">
            Sign in
          </Link>{" "}
          to keep it on all your devices.
        </p>
      )}
      {shown.length === 0 ? (
        <div className="border border-line bg-paper px-6 py-16 text-center">
          <p className="font-serif text-3xl">Nothing saved yet</p>
          <p className="mx-auto mt-3 max-w-sm text-sm text-ink-soft">
            Tap the heart on any piece to save it here for later.
          </p>
          <Link href="/earrings" className="btn btn-primary mt-8">
            Explore earrings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {shown.map(({ product: p, kind, collection }) => (
            <div key={p.id} className="flex flex-col gap-3">
              <ProductCard product={p} kind={kind} collection={collection} />
              <button
                type="button"
                className="btn btn-outline mt-auto w-full !min-h-10 !px-3 !text-[0.7rem]"
                disabled={p.stock === 0}
                onClick={() =>
                  add({
                    product_id: p.id,
                    slug: p.slug,
                    name: p.name,
                    price: p.price,
                    image: p.images[0]?.thumb ?? p.images[0]?.url ?? "",
                    material: p.material,
                    kind,
                    stock: p.stock,
                  })
                }
              >
                {p.stock === 0 ? "Sold out" : "Add to bag"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
