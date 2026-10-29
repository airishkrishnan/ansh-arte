"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearRecent, pushRecent, readRecent, RECENT_EVENT } from "@/lib/recent";
import type { SearchItem } from "@/lib/search";
import { formatPrice } from "@/lib/site";

// One fetch of the search index per page load, shared by every row on the page
let index: Promise<SearchItem[]> | null = null;
const loadIndex = () =>
  (index ??= fetch("/api/search")
    .then((r) => r.json() as Promise<SearchItem[]>)
    .catch(() => {
      index = null;
      return [];
    }));

/** Remembers that this product was opened. Renders nothing. */
export function TrackView({ slug }: { slug: string }) {
  useEffect(() => pushRecent(slug), [slug]);
  return null;
}

/**
 * "Recently viewed" row. Shows nothing until the shopper has looked at a piece,
 * so first-time visitors never see an empty section.
 */
export function RecentlyViewed({
  exclude,
  eyebrow = "Pick up where you left off",
  title = "Recently viewed",
  compact = false,
  onNavigate,
  className = "",
}: {
  exclude?: string;
  eyebrow?: string;
  title?: string;
  /** Smaller tiles with no heading eyebrow, for the bag drawer */
  compact?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const [items, setItems] = useState<SearchItem[]>([]);

  useEffect(() => {
    let alive = true;
    const update = async () => {
      const slugs = readRecent().filter((s) => s !== exclude);
      if (!slugs.length) return alive && setItems([]);
      const all = await loadIndex();
      const bySlug = new Map(all.map((i) => [i.slug, i]));
      if (alive) setItems(slugs.map((s) => bySlug.get(s)).filter((i): i is SearchItem => !!i));
    };
    update();
    window.addEventListener(RECENT_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      alive = false;
      window.removeEventListener(RECENT_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [exclude]);

  if (!items.length) return null;

  return (
    <section className={className} aria-label={title} data-reveal={compact ? undefined : true}>
      <div className={`flex items-end justify-between gap-4 ${compact ? "mb-3" : "mb-8"}`}>
        <div>
          {!compact && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h2 className={compact ? "font-serif text-xl" : "heading-lg"}>{title}</h2>
        </div>
        <button
          type="button"
          onClick={clearRecent}
          className="shrink-0 text-xs text-muted underline underline-offset-4 hover:text-ink"
        >
          Clear
        </button>
      </div>
      <ul
        className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto ${
          compact ? "gap-3" : "-mx-4 scroll-px-4 gap-3 px-4 md:mx-0 md:scroll-px-0 md:gap-5 md:px-0"
        }`}
      >
        {items.map((i) => (
          <li key={i.slug} className={`shrink-0 snap-start ${compact ? "w-28" : "w-36 md:w-44"}`}>
            <Link href={`/product/${i.slug}`} onClick={onNavigate} className="group block" prefetch={false}>
              <div className={`aspect-[4/5] overflow-hidden bg-sand ${i.image ? "shimmer" : ""}`}>
                {i.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- small thumbnail
                  <img
                    src={i.image}
                    alt={i.name}
                    loading="lazy"
                    data-fade
                    className="size-full object-cover transition-[opacity,transform] duration-700 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <p className={`mt-2 truncate font-serif leading-tight ${compact ? "text-base" : "text-lg"}`}>{i.name}</p>
              <p className="text-sm font-semibold">{formatPrice(i.price)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
