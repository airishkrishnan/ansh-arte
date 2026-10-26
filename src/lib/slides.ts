/**
 * Home page banner slides. To use your own banner, put a wide photo (about
 * 1920×1080, subject on the right, darker on the left) in public/banners and
 * point `image` at it.
 */
export type Slide = {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  /** Words of the title shown in italic accent colour */
  accent?: string;
  text: string;
  href: string;
};

export const HERO_SLIDES: Slide[] = [
  {
    image: "/samples/banner-temple.webp",
    alt: "Oxidised brass temple jhumkas hanging on a dark wooden stand",
    eyebrow: "The temple edit",
    title: "Heritage, handcrafted for you.",
    accent: "handcrafted",
    text: "Oxidised brass jhumkas inspired by South Indian temple art, finished by hand.",
    href: "/earrings?material=oxidised-brass",
  },
  {
    image: "/samples/banner-silver.webp",
    alt: "A woman wearing a long oxidised German silver jhumka earring",
    eyebrow: "German silver",
    title: "Silver that tells a story.",
    accent: "tells a story",
    text: "Statement jhumkas and chandbalis in oxidised German silver, made to be noticed.",
    href: "/earrings?material=german-silver",
  },
  {
    image: "/samples/banner-festive.webp",
    alt: "Oxidised earrings and a silver ring in a velvet box beside a lit diya and marigolds",
    eyebrow: "Festive gifting",
    title: "Gifts wrapped in tradition.",
    accent: "tradition",
    text: "Handpicked pieces for Diwali, weddings and every celebration in between.",
    href: "/collections",
  },
];
