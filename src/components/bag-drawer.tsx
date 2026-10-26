"use client";

import Link from "next/link";
import { useEffect } from "react";
import { formatPrice } from "@/lib/site";
import { useCart } from "./cart";
import { CloseIcon, MinusIcon, PlusIcon, TruckIcon } from "./icons";
import { ProductArt } from "./product-art";

export function LineThumb({ image, kind, material }: { image: string; kind: string; material: "oxidised-brass" | "german-silver" }) {
  return (
    <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-sand">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- small thumbnail
        <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <ProductArt kind={kind} material={material} className="absolute inset-0 size-full" />
      )}
    </div>
  );
}

export function QtyStepper({
  qty,
  max,
  onChange,
}: {
  qty: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="inline-flex h-9 items-center border border-line">
      <button
        type="button"
        className="grid h-full w-9 place-items-center disabled:opacity-30"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= 1}
        aria-label="Decrease quantity"
      >
        <MinusIcon />
      </button>
      <span className="w-7 text-center text-sm tabular-nums">{qty}</span>
      <button
        type="button"
        className="grid h-full w-9 place-items-center disabled:opacity-30"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= Math.min(max, 10)}
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </button>
    </div>
  );
}

export function BagDrawer({ freeShippingAbove }: { freeShippingAbove: number }) {
  const { lines, open, setOpen, setQty, remove, subtotal } = useCart();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const left = Math.max(freeShippingAbove - subtotal, 0);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside
        role="dialog"
        aria-label="Your bag"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ivory transition-transform duration-500 ease-[var(--ease-lux)] ${
          open ? "translate-x-0 shadow-2xl" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <p className="font-serif text-2xl">Your bag</p>
          <button type="button" onClick={() => setOpen(false)} className="-mr-2 p-2" aria-label="Close bag">
            <CloseIcon className="size-6" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <p className="font-serif text-3xl">Your bag is empty</p>
            <p className="text-sm text-ink-soft">Find a piece that feels like you.</p>
            <Link href="/earrings" className="btn btn-primary" onClick={() => setOpen(false)}>
              Shop earrings
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line bg-sand/50 px-5 py-4">
              <div className="flex items-center gap-3 text-sm">
                <TruckIcon className={`size-5 shrink-0 ${left > 0 ? "text-brass-deep" : "text-success"}`} />
                {left > 0 ? (
                  <p className="text-ink-soft">
                    You&apos;re <strong className="text-ink">{formatPrice(left)}</strong> away from free shipping
                  </p>
                ) : (
                  <p className="font-semibold text-success">You&apos;ve unlocked free shipping</p>
                )}
              </div>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-label="Progress to free shipping"
                aria-valuemin={0}
                aria-valuemax={freeShippingAbove}
                aria-valuenow={Math.min(subtotal, freeShippingAbove)}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-[var(--ease-lux)] ${left > 0 ? "bg-brass-deep" : "bg-success"}`}
                  style={{ width: `${Math.min((subtotal / freeShippingAbove) * 100, 100)}%` }}
                />
              </div>
              {left > 0 && (
                <p className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                  Free shipping on orders above {formatPrice(freeShippingAbove)}
                </p>
              )}
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.product_id} className="flex gap-4 py-5">
                  <Link href={`/product/${l.slug}`} onClick={() => setOpen(false)}>
                    <LineThumb image={l.image} kind={l.kind} material={l.material} />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/product/${l.slug}`}
                        onClick={() => setOpen(false)}
                        className="font-serif text-lg leading-snug"
                      >
                        {l.name}
                      </Link>
                      <p className="text-sm font-semibold">{formatPrice(l.price * l.qty)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QtyStepper qty={l.qty} max={l.stock} onChange={(n) => setQty(l.product_id, n)} />
                      <button
                        type="button"
                        onClick={() => remove(l.product_id)}
                        className="text-xs uppercase tracking-[0.14em] text-muted underline-offset-4 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-4 border-t border-line bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm uppercase tracking-[0.14em] text-ink-soft">Subtotal</span>
                <span className="font-serif text-2xl">{formatPrice(subtotal)}</span>
              </div>
              <Link href="/checkout" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
                Checkout
              </Link>
              <p className="text-center text-xs text-muted">
                Confirm on WhatsApp · Pay securely by UPI
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
