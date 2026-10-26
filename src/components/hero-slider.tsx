"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/slides";
import { ArrowIcon, ChevronIcon } from "./icons";

const INTERVAL = 6000;

function Title({ slide, first }: { slide: Slide; first: boolean }) {
  const Tag = first ? "h1" : "h2";
  const parts = slide.accent ? slide.title.split(slide.accent) : [slide.title];
  return (
    <Tag className="heading-xl text-balance">
      {parts[0]}
      {slide.accent && parts.length > 1 && (
        <>
          <em className="font-normal text-silver">{slide.accent}</em>
          {parts.slice(1).join(slide.accent)}
        </>
      )}
    </Tag>
  );
}

/** Full-width banner that crossfades between slides, each with its own Shop now button. */
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(active + 1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [active, paused, count, go]);

  return (
    <section
      className="relative isolate overflow-hidden bg-ink text-brass-soft"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="relative h-[86svh] max-h-[52rem] min-h-[34rem] md:h-[78vh] md:min-h-[36rem]">
        {slides.map((s, i) => (
          <div
            key={s.image}
            className={`absolute inset-0 transition-opacity duration-1000 ease-[var(--ease-lux)] ${
              i === active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== active}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- banner photo */}
            <img
              src={s.image}
              alt={s.alt}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              className={`absolute inset-0 size-full object-cover object-[72%_center] md:object-center ${
                i === active ? "hero-zoom" : ""
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10 md:bg-gradient-to-r md:from-ink/90 md:via-ink/45 md:to-transparent" />
            <div className="container-lux relative flex h-full items-end pb-24 md:items-center md:pb-0">
              <div className={`max-w-xl space-y-6 ${i === active ? "animate-rise" : ""}`}>
                <p className="eyebrow !text-silver">{s.eyebrow}</p>
                <Title slide={s} first={i === 0} />
                <p className="max-w-md text-[1.05rem] leading-relaxed text-brass-soft/85">{s.text}</p>
                <Link href={s.href} className="btn btn-light" tabIndex={i === active ? 0 : -1}>
                  Shop now <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="container-lux absolute inset-x-0 bottom-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.image}
                type="button"
                onClick={() => go(i)}
                className="grid h-11 place-items-center px-1"
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === active}
              >
                <span
                  className={`block h-[3px] rounded-full transition-all duration-500 ${
                    i === active ? "w-10 bg-brass-soft" : "w-5 bg-brass-soft/35"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => go(active - 1)}
              className="grid size-11 place-items-center rounded-full border border-brass-soft/40 transition-colors hover:bg-brass-soft hover:text-ink"
              aria-label="Previous slide"
            >
              <ChevronIcon className="size-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              className="grid size-11 place-items-center rounded-full border border-brass-soft/40 transition-colors hover:bg-brass-soft hover:text-ink"
              aria-label="Next slide"
            >
              <ChevronIcon className="size-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
