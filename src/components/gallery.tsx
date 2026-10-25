"use client";

import { useRef, useState } from "react";
import type { Material, ProductImage } from "@/lib/types";
import { ProductArt } from "./product-art";

/** Swipeable photo gallery: scroll-snap on phones, thumbnails on desktop, tap to zoom. */
export function Gallery({
  images,
  name,
  kind,
  material,
}: {
  images: ProductImage[];
  name: string;
  kind: string;
  material: Material;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null);
  const track = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="bg-sand">
        <ProductArt kind={kind} material={material} className="aspect-[4/5] w-full" />
      </div>
    );
  }

  const go = (i: number) => {
    setActive(i);
    const el = track.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  };

  return (
    <div className="md:grid md:grid-cols-[4.5rem_1fr] md:gap-4">
      <div className="order-2 hidden flex-col gap-3 md:flex">
        {images.map((img, i) => (
          <button
            key={img.url}
            type="button"
            onClick={() => go(i)}
            className={`aspect-[4/5] overflow-hidden border transition-colors ${
              i === active ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
            }`}
            aria-label={`Show photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail */}
            <img src={img.thumb ?? img.url} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
      <div className="relative md:order-2 md:col-start-2 md:row-start-1">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto bg-sand"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }}
        >
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              className="aspect-[4/5] w-full shrink-0 snap-center cursor-zoom-in"
              onClick={() => setZoom(img.url)}
              aria-label="Zoom photo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- product photo */}
              <img
                src={img.url}
                alt={img.alt || `${name}, photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 md:hidden">
            {images.map((img, i) => (
              <span
                key={img.url}
                className={`h-1 rounded-full transition-all ${i === active ? "w-5 bg-ink" : "w-1.5 bg-ink/30"}`}
              />
            ))}
          </div>
        )}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[60] overflow-auto bg-paper" role="dialog" aria-label="Zoomed photo">
          <button
            type="button"
            className="fixed right-4 top-4 z-10 rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-paper"
            onClick={() => setZoom(null)}
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- zoomed product photo */}
          <img src={zoom} alt={name} className="mx-auto min-h-full w-[160%] max-w-none object-contain md:w-auto md:max-w-full" />
        </div>
      )}
    </div>
  );
}
