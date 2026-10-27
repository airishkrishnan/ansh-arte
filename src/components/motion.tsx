"use client";

import { useEffect } from "react";

/**
 * Turns on the gentle scroll animations: anything marked data-reveal fades up
 * when it scrolls into view, and photos marked data-fade fade in once loaded.
 * Whatever is already on screen when the page opens is shown straight away.
 */
export function Motion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-shown", "");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );

    const loaded = (img: HTMLImageElement) => img.setAttribute("data-loaded", "");
    const watchImage = (img: HTMLImageElement) => {
      if (img.dataset.watched !== undefined) return;
      img.dataset.watched = "";
      if (img.complete) return loaded(img);
      img.addEventListener("load", () => loaded(img), { once: true });
      img.addEventListener("error", () => loaded(img), { once: true });
    };

    const scan = (first = false) => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown]):not([data-watched])").forEach((el) => {
        el.dataset.watched = "";
        // On first load, show what's already in view without animating it
        if (first && el.getBoundingClientRect().top < window.innerHeight) el.setAttribute("data-shown", "");
        else io.observe(el);
      });
      document.querySelectorAll<HTMLImageElement>("img[data-fade]:not([data-loaded])").forEach(watchImage);
    };

    scan(true);
    root.classList.add("motion-on");

    // Pages opened by tapping a link add new content without a reload
    let frame = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => scan());
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
      root.classList.remove("motion-on");
    };
  }, []);

  return null;
}
