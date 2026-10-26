import type { Slide } from "./slides";

/**
 * Festive edits switch on and off by date (India time). While one is live it
 * gets its own page at /festive/<slug> and leads the home page banner.
 * Add or change a season by editing this list; dates are inclusive.
 * To preview an edit before it starts, open /festive/<slug>?preview=1.
 */
export type Festive = {
  slug: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  /** Products under this price get their own "gifts under" row */
  giftsUnder?: number;
  story: string;
  slide: Omit<Slide, "href">;
};

export const FESTIVE: Festive[] = [
  {
    slug: "diwali",
    name: "The Diwali Edit",
    start: "2026-10-15",
    end: "2026-11-10",
    giftsUnder: 999,
    story:
      "Lamps, marigolds and a little something that shines. Handpicked oxidised pieces to wear through the festival, and gifts your loved ones will keep for years.",
    slide: {
      image: "/samples/banner-festive.webp",
      alt: "Oxidised earrings and a silver ring in a velvet box beside a lit diya and marigolds",
      eyebrow: "The Diwali edit",
      title: "Light up the festival.",
      accent: "Light up",
      text: "Festive jhumkas, statement rings and gifts under ₹999, ready to ship across India.",
    },
  },
  {
    slug: "valentines",
    name: "Valentine's Gifts",
    start: "2027-02-01",
    end: "2027-02-14",
    giftsUnder: 799,
    story: "Small, meaningful and made by hand. Studs, rings and delicate drops to say it without words.",
    slide: {
      image: "/samples/banner-festive.webp",
      alt: "Oxidised earrings and a silver ring in a velvet box",
      eyebrow: "Valentine's gifts",
      title: "Say it with silver.",
      accent: "silver",
      text: "Delicate studs, rings and drops, gift-ready and shipped across India.",
    },
  },
  {
    slug: "wedding-season",
    name: "The Wedding Edit",
    start: "2026-11-11",
    end: "2027-03-15",
    story:
      "Mehendi, sangeet and the big day. Statement jhumkas and chandbalis that hold their own with silk and zari.",
    slide: {
      image: "/samples/banner-silver.webp",
      alt: "A woman wearing a long oxidised German silver jhumka earring",
      eyebrow: "The wedding edit",
      title: "Made for the big day.",
      accent: "big day",
      text: "Statement jhumkas and chandbalis for every function of the wedding season.",
    },
  },
];

/** Today's date in India as YYYY-MM-DD. */
const todayIST = (now = new Date()) =>
  new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const isLive = (f: Festive, now = new Date()) => {
  const d = todayIST(now);
  return d >= f.start && d <= f.end;
};

/** The first edit in the list that is live today, if any. */
export const liveFestive = (now = new Date()) => FESTIVE.find((f) => isLive(f, now)) ?? null;

export const festiveSlide = (f: Festive): Slide => ({ ...f.slide, href: `/festive/${f.slug}` });
