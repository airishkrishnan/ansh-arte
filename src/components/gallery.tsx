"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { samplePhoto } from "@/lib/samples";
import type { Material, ProductImage } from "@/lib/types";
import { ChevronIcon, CloseIcon } from "./icons";
import { ProductArt } from "./product-art";

const ZOOM = 2.5;

const ExpandIcon = ({ className = "size-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

const Arrow = ({ dir, onClick, className = "" }: { dir: -1 | 1; onClick: () => void; className?: string }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={dir < 0 ? "Previous photo" : "Next photo"}
    className={`grid size-11 place-items-center rounded-full transition-colors ${className}`}
  >
    <ChevronIcon className={`size-5 ${dir < 0 ? "rotate-180" : ""}`} />
  </button>
);

/**
 * Product photos: swipe on phones, thumbnails and hover-zoom on desktop.
 * Tapping a photo opens a full-screen viewer with swipe, tap-to-zoom and keyboard arrows.
 */
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
  const [viewer, setViewer] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);

  // No real photos yet: show the sample photo (still zoomable) or the line illustration
  const sample = images.length === 0 ? samplePhoto(kind, material) : null;
  const photos: ProductImage[] = images.length ? images : sample ? [{ url: sample, alt: name }] : [];

  if (photos.length === 0) {
    return (
      <div className="relative bg-sand">
        <ProductArt kind={kind} material={material} className="aspect-[4/5] w-full" />
      </div>
    );
  }

  const many = photos.length > 1;
  const go = (i: number, smooth = true) => {
    const next = (i + photos.length) % photos.length;
    setActive(next);
    const el = track.current;
    if (el) el.scrollTo({ left: el.clientWidth * next, behavior: smooth ? "smooth" : "instant" });
  };

  return (
    <div className="md:grid md:grid-cols-[4.5rem_1fr] md:gap-4">
      <div className="order-2 hidden flex-col gap-3 md:flex">
        {many &&
          photos.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => go(i)}
              className={`aspect-[4/5] overflow-hidden border bg-sand transition-[border-color,opacity] ${
                i === active ? "border-ink" : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail */}
              <img src={img.thumb ?? img.url} alt="" className="size-full object-cover" />
            </button>
          ))}
      </div>

      <div className="group/gallery relative md:order-2 md:col-start-2 md:row-start-1">
        <div
          ref={track}
          className="shimmer no-scrollbar flex snap-x snap-mandatory overflow-x-auto bg-sand"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }}
        >
          {photos.map((img, i) => (
            <button
              key={img.url}
              type="button"
              className="group/photo relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden cursor-zoom-in"
              onClick={() => setViewer(i)}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
                e.currentTarget.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
              }}
              aria-label={`Open photo ${i + 1} full screen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- product photo */}
              <img
                src={img.url}
                alt={img.alt || `${name}, photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                data-fade
                className="size-full origin-[var(--zx,50%)_var(--zy,50%)] object-cover transition-[opacity,transform] duration-500 ease-[var(--ease-lux)] group-hover/photo:scale-[1.6]"
              />
            </button>
          ))}
        </div>

        {many && (
          <>
            <Arrow dir={-1} onClick={() => go(active - 1)} className="absolute left-3 top-1/2 hidden -translate-y-1/2 bg-paper/85 text-ink opacity-0 shadow-sm hover:bg-paper group-hover/gallery:opacity-100 focus-visible:opacity-100 md:grid" />
            <Arrow dir={1} onClick={() => go(active + 1)} className="absolute right-3 top-1/2 hidden -translate-y-1/2 bg-paper/85 text-ink opacity-0 shadow-sm hover:bg-paper group-hover/gallery:opacity-100 focus-visible:opacity-100 md:grid" />
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5 md:hidden">
              {photos.map((img, i) => (
                <span
                  key={img.url}
                  className={`h-1 rounded-full transition-all ${i === active ? "w-5 bg-ink" : "w-1.5 bg-ink/30"}`}
                />
              ))}
            </div>
          </>
        )}

        <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-paper/85 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          <ExpandIcon />
          <span className="md:hidden">Tap to zoom</span>
          <span className="hidden md:inline">Click to enlarge</span>
        </span>
        {sample && (
          <span className="pointer-events-none absolute bottom-3 left-3 bg-paper/85 px-2 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Sample photo
          </span>
        )}
      </div>

      {viewer !== null && (
        <Viewer
          photos={photos}
          name={name}
          start={viewer}
          onClose={(last) => {
            setViewer(null);
            go(last, false);
          }}
        />
      )}
    </div>
  );
}

/** Full-screen photo viewer: swipe or arrow keys between photos, tap to zoom in and pan. */
function Viewer({
  photos,
  name,
  start,
  onClose,
}: {
  photos: ProductImage[];
  name: string;
  start: number;
  onClose: (last: number) => void;
}) {
  const [index, setIndex] = useState(start);
  const [zoom, setZoom] = useState<{ width: number; fx: number; fy: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const many = photos.length > 1;

  const show = (i: number, smooth = true) => {
    const next = (i + photos.length) % photos.length;
    setZoom(null);
    setIndex(next);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: el.clientWidth * next, behavior: smooth ? "smooth" : "instant" });
  };

  // Open on the photo that was tapped, lock the page behind, and give focus back on close
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollLeft = el.clientWidth * start;
    const opener = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      html.style.overflow = prev;
      opener?.focus({ preventScroll: true });
    };
  }, [start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (zoom) setZoom(null);
        else onClose(index);
      } else if (many && e.key === "ArrowRight") show(index + 1);
      else if (many && e.key === "ArrowLeft") show(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // After zooming in, scroll so the spot that was tapped sits in the middle
  useLayoutEffect(() => {
    const pane = paneRef.current;
    if (!zoom || !pane) return;
    const img = pane.querySelector("img");
    if (!img) return;
    pane.scrollLeft = zoom.fx * img.offsetWidth - pane.clientWidth / 2;
    pane.scrollTop = zoom.fy * img.offsetHeight - pane.clientHeight / 2;
  }, [zoom]);

  const toggleZoom = (e: React.MouseEvent<HTMLImageElement>) => {
    if (zoom) return setZoom(null);
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({
      width: r.width * ZOOM,
      fx: (e.clientX - r.left) / r.width,
      fy: (e.clientY - r.top) / r.height,
    });
  };

  return createPortal(
    <div
      className="animate-[fade_0.3s_ease] fixed inset-0 z-[80] flex flex-col bg-ink text-paper"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} photos`}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-soft" aria-live="polite">
          {many ? `${index + 1} / ${photos.length}` : name}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={() => onClose(index)}
          className="grid size-11 place-items-center rounded-full border border-paper/20 hover:border-paper/60"
          aria-label="Close photos"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          className={`no-scrollbar flex size-full snap-x snap-mandatory ${zoom ? "overflow-hidden" : "overflow-x-auto"}`}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== index) {
              setZoom(null);
              setIndex(i);
            }
          }}
        >
          {photos.map((img, i) => {
            const zoomed = zoom && i === index;
            return (
              <div
                key={img.url}
                ref={i === index ? paneRef : undefined}
                className={`no-scrollbar flex size-full shrink-0 snap-center ${zoomed ? "overflow-auto" : "overflow-hidden"}`}
                onPointerMove={(e) => {
                  // With a mouse, panning follows the pointer; on touch the photo is dragged natively
                  if (!zoomed || e.pointerType !== "mouse") return;
                  const pane = e.currentTarget;
                  const r = pane.getBoundingClientRect();
                  pane.scrollLeft = ((e.clientX - r.left) / r.width) * (pane.scrollWidth - pane.clientWidth);
                  pane.scrollTop = ((e.clientY - r.top) / r.height) * (pane.scrollHeight - pane.clientHeight);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- full-size product photo */}
                <img
                  src={img.url}
                  alt={img.alt || `${name}, photo ${i + 1}`}
                  loading={Math.abs(i - start) <= 1 ? "eager" : "lazy"}
                  onClick={toggleZoom}
                  draggable={false}
                  style={zoomed ? { width: zoom.width } : undefined}
                  className={`m-auto shrink-0 select-none ${
                    zoomed ? "max-w-none cursor-zoom-out" : "max-h-full max-w-full cursor-zoom-in object-contain"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {many && !zoom && (
          <>
            <Arrow dir={-1} onClick={() => show(index - 1)} className="absolute left-4 top-1/2 hidden -translate-y-1/2 border border-paper/20 bg-ink/60 hover:border-paper/60 md:grid" />
            <Arrow dir={1} onClick={() => show(index + 1)} className="absolute right-4 top-1/2 hidden -translate-y-1/2 border border-paper/20 bg-ink/60 hover:border-paper/60 md:grid" />
          </>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-3 px-4 pb-5 pt-3">
        {many && (
          <div className="flex gap-1.5">
            {photos.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => show(i)}
                className="grid h-6 place-items-center px-0.5"
                aria-label={`Show photo ${i + 1}`}
              >
                <span className={`block h-1 rounded-full transition-all ${i === index ? "w-6 bg-paper" : "w-1.5 bg-paper/35"}`} />
              </button>
            ))}
          </div>
        )}
        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-paper/50">
          <span className="md:hidden">
            {zoom ? "Drag to look around · tap to zoom out" : many ? "Tap to zoom · swipe for more" : "Tap to zoom"}
          </span>
          <span className="hidden md:inline">
            {zoom ? "Move the mouse to look around · click to zoom out" : many ? "Click to zoom · arrow keys for more" : "Click to zoom"}
          </span>
        </p>
      </div>
    </div>,
    document.body,
  );
}
