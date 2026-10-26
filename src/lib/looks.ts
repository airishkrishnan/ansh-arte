import type { Material } from "./types";

/**
 * "Shop the look" on the home page: one styled photo with tappable dots.
 * Each dot points at a style (category slug) and, optionally, a metal; the
 * store shows the newest in-stock piece that matches. x and y are percentages
 * from the photo's top-left corner.
 */
export type LookSpot = { x: number; y: number; style: string; material?: Material };

export const LOOK = {
  image: "/samples/look-tray.webp",
  alt: "Jhumkas, a temple ring, hoops and flower studs arranged on a wooden tray with rose petals",
  eyebrow: "Shop the look",
  title: "The everyday heirloom edit",
  text: "Brass jhumkas, a temple ring, silver hoops and petal studs. Tap a piece to shop it.",
  spots: [
    { x: 40, y: 42, style: "jhumkas", material: "oxidised-brass" },
    { x: 64, y: 39, style: "rings" },
    { x: 40, y: 63, style: "hoops", material: "german-silver" },
    { x: 63, y: 61, style: "studs" },
  ] as LookSpot[],
};
