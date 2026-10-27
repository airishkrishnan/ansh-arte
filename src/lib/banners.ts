import { samplePhoto } from "./samples";

/**
 * Wide, dark photos for the top of category and collection pages. Put a
 * 1920×1080 photo (subject on the right, darker on the left) in public/banners
 * and point a category here to change it. A collection's own banner, uploaded
 * in the admin, always wins.
 */
const CATEGORY_BANNERS: Record<string, string> = {
  earrings: "/samples/banner-temple.webp",
  rings: "/samples/banner-rings.webp",
};
const DEFAULT_BANNER = "/samples/banner-silver.webp";

export const categoryBanner = (slug: string) => CATEGORY_BANNERS[slug] ?? DEFAULT_BANNER;

/** A style page (e.g. Jhumkas) uses its own photo, then a sample of that style, then its category's banner. */
export const styleBanner = (style: { slug: string; image_url: string | null }, categorySlug: string) =>
  style.image_url ?? samplePhoto(style.slug, "oxidised-brass") ?? categoryBanner(categorySlug);
