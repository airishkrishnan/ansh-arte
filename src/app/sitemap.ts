import type { MetadataRoute } from "next";
import { categoryHref, getCatalogue, getProducts } from "@/lib/data";
import { liveFestive } from "@/lib/festive";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalogue, products] = await Promise.all([getCatalogue(), getProducts()]);
  const now = new Date();
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: SITE_URL + path,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  });
  const festive = liveFestive();
  return [
    page("/", 1),
    ...(festive ? [page(`/festive/${festive.slug}`, 0.8)] : []),
    page("/collections", 0.8),
    ...catalogue.categories.map((c) => page(categoryHref(catalogue, c), c.parent_id ? 0.8 : 0.9)),
    ...catalogue.collections.map((c) => page(`/collections/${c.slug}`, 0.7)),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: new Date(p.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.images.slice(0, 3).map((i) => i.url),
    })),
    page("/about", 0.5),
    page("/care-guide", 0.5),
    page("/shipping-returns", 0.4),
    page("/contact", 0.4),
    page("/refund-policy", 0.3),
    page("/privacy-policy", 0.2),
    page("/terms", 0.2),
  ];
}
