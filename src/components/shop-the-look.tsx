"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/site";
import { ArrowIcon, PlusIcon } from "./icons";

export type LookItem = {
  x: number;
  y: number;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  meta: string;
};

/** A styled photo with numbered dots; tapping a dot (or a list row) highlights that piece. */
export function ShopTheLook({
  image,
  alt,
  eyebrow,
  title,
  text,
  items,
}: {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  text: string;
  items: LookItem[];
}) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24">
      <div className="container-lux grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16">
        <div className="relative overflow-hidden bg-sand">
          {/* eslint-disable-next-line @next/next/no-img-element -- styled look photo */}
          <img src={image} alt={alt} loading="lazy" className="aspect-square w-full object-cover" />
          {items.map((it, i) => (
            <button
              key={it.slug + i}
              type="button"
              onClick={() => setActive(active === i ? null : i)}
              className="absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center"
              style={{ left: `${it.x}%`, top: `${it.y}%` }}
              aria-label={`Show ${it.name}`}
              aria-pressed={active === i}
            >
              <span
                className={`grid size-8 place-items-center rounded-full border border-paper shadow-[0_4px_14px_rgba(33,27,26,0.35)] transition-all duration-300 ${
                  active === i ? "scale-110 bg-ink text-paper" : "bg-paper/90 text-ink"
                }`}
              >
                <PlusIcon className={`size-4 transition-transform duration-300 ${active === i ? "rotate-45" : ""}`} />
              </span>
              {active !== i && <span className="absolute size-8 animate-ping rounded-full bg-paper/40" aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div>
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="heading-lg">{title}</h2>
          <p className="mt-4 max-w-md text-ink-soft">{text}</p>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {items.map((it, i) => (
              <li key={it.slug + i}>
                <Link
                  href={`/product/${it.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className={`flex items-center gap-4 px-2 py-3 transition-colors ${active === i ? "bg-sand" : "hover:bg-sand/60"}`}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-xs font-semibold">
                    {i + 1}
                  </span>
                  <div className="aspect-[4/5] w-12 shrink-0 overflow-hidden bg-sand">
                    {it.image && (
                      // eslint-disable-next-line @next/next/no-img-element -- look thumbnail
                      <img src={it.image} alt="" loading="lazy" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg leading-tight">{it.name}</p>
                    <p className="truncate text-xs text-muted">{it.meta}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(it.price)}</span>
                  <ArrowIcon className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
