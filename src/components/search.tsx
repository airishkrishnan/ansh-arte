"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchItems, type SearchItem } from "@/lib/search";
import { formatPrice } from "@/lib/site";
import { CloseIcon, SearchIcon } from "./icons";

const SUGGESTIONS = ["Jhumkas", "German silver", "Hoops", "Rings", "Studs"];

/** Search icon in the header that opens a full-screen search with instant results. */
export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- close after navigating
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    if (!items) {
      fetch("/api/search")
        .then((r) => r.json())
        .then(setItems)
        .catch(() => setItems([]));
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, items]);

  const results = useMemo(
    () => (items ? searchItems(items, q).slice(0, 8) : []),
    [items, q],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2"
        aria-label="Search"
      >
        <SearchIcon className="size-6" />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] overflow-y-auto bg-ivory"
            role="dialog"
            aria-label="Search"
          >
            <div className="container-lux max-w-3xl py-5 md:py-10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (q.trim())
                    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
                }}
                className="flex items-center gap-3 border-b border-ink pb-3"
              >
                <SearchIcon className="size-6 shrink-0 text-muted" />
                <label htmlFor="site-search" className="sr-only">
                  Search jewellery
                </label>
                <input
                  id="site-search"
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder="Search jhumkas, silver, rings…"
                  className="min-w-0 flex-1 bg-transparent font-serif [&::-webkit-search-cancel-button]:appearance-none text-2xl outline-none placeholder:text-muted/70 md:text-3xl"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="-mr-2 p-2"
                  aria-label="Close search"
                >
                  <CloseIcon className="size-6" />
                </button>
              </form>

              {!q.trim() ? (
                <div className="mt-8">
                  <p className="eyebrow mb-4">Popular searches</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="chip"
                        onClick={() => setQ(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : items === null ? (
                <p className="mt-8 text-sm text-muted">Searching…</p>
              ) : results.length === 0 ? (
                <p className="mt-8 text-ink-soft">
                  Nothing found for “{q.trim()}”. Try a style like jhumkas or a
                  metal like silver.
                </p>
              ) : (
                <>
                  <ul className="mt-6 divide-y divide-line">
                    {results.map((r) => (
                      <li key={r.slug}>
                        <Link
                          href={`/product/${r.slug}`}
                          className="flex items-center gap-4 py-3 hover:bg-sand/50"
                        >
                          <div className="aspect-[4/5] w-14 shrink-0 overflow-hidden bg-sand">
                            {r.image && (
                              // eslint-disable-next-line @next/next/no-img-element -- search thumbnail
                              <img
                                src={r.image}
                                alt=""
                                className="size-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-serif text-lg leading-tight">
                              {r.name}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {r.meta}
                            </p>
                          </div>
                          <span className="text-sm font-semibold">
                            {formatPrice(r.price)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/search?q=${encodeURIComponent(q.trim())}`}
                    className="btn btn-outline mt-6 w-full"
                  >
                    See all results
                  </Link>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
