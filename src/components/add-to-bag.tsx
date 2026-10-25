"use client";

import { useState } from "react";
import { formatPrice, whatsappLink } from "@/lib/site";
import type { Product } from "@/lib/types";
import { QtyStepper } from "./bag-drawer";
import { useCart } from "./cart";
import { CheckIcon, WhatsAppIcon } from "./icons";

export function AddToBag({
  product,
  kind,
  whatsapp,
  productUrl,
}: {
  product: Product;
  kind: string;
  whatsapp: string;
  productUrl: string;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock === 0;

  const onAdd = () => {
    add(
      {
        product_id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0]?.thumb ?? product.images[0]?.url ?? "",
        material: product.material,
        kind,
        stock: product.stock,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const ask = whatsappLink(
    whatsapp,
    soldOut
      ? `Hi Ansh Arte! Will "${product.name}" be back in stock?\n${productUrl}`
      : `Hi Ansh Arte! I'm interested in "${product.name}" (${formatPrice(product.price)}).\n${productUrl}`,
  );

  return (
    <div className="space-y-4">
      {!soldOut && (
        <div className="flex items-center gap-4">
          <span className="label !mb-0">Quantity</span>
          <QtyStepper qty={qty} max={product.stock} onChange={setQty} />
          {product.stock <= 2 && (
            <span className="text-xs font-semibold text-temple">Only {product.stock} left</span>
          )}
        </div>
      )}
      <div className="grid gap-3">
        {soldOut ? (
          <button type="button" className="btn btn-primary w-full" disabled>
            Sold out
          </button>
        ) : (
          <button type="button" onClick={onAdd} className="btn btn-primary w-full">
            {added ? (
              <>
                <CheckIcon /> Added to bag
              </>
            ) : (
              <>Add to bag · {formatPrice(product.price * qty)}</>
            )}
          </button>
        )}
        <a href={ask} target="_blank" rel="noopener" className="btn btn-outline w-full">
          <WhatsAppIcon className="size-4" />
          {soldOut ? "Ask when it's back" : "Ask on WhatsApp"}
        </a>
      </div>

      {/* Sticky buy bar on phones */}
      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-base leading-tight">{product.name}</p>
            <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
          </div>
          <button type="button" onClick={onAdd} className="btn btn-primary !min-h-11 !px-5">
            {added ? "Added" : "Add to bag"}
          </button>
        </div>
      )}
    </div>
  );
}
