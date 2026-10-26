import "server-only";
import { cache } from "react";
import { demo } from "./demo";
import { DEFAULT_SETTINGS } from "./site";
import { getServerSupabase, supabaseConfigured } from "./supabase/client";
import type { Category, Collection, Material, Product, Settings } from "./types";

export type Catalogue = {
  categories: Category[];
  collections: Collection[];
};

/** All visible categories, styles and collections, sorted. Cached per request. */
export const getCatalogue = cache(async (): Promise<Catalogue> => {
  if (!supabaseConfigured) return { categories: demo.categories, collections: demo.collections };
  const sb = getServerSupabase();
  const [cats, cols] = await Promise.all([
    sb.from("categories").select("*").eq("visible", true).order("sort").order("name"),
    sb.from("collections").select("*").eq("visible", true).order("sort").order("name"),
  ]);
  if (cats.error) throw cats.error;
  if (cols.error) throw cols.error;
  return { categories: cats.data as Category[], collections: cols.data as Collection[] };
});

export const getSettings = cache(async (): Promise<Settings> => {
  if (!supabaseConfigured) return DEFAULT_SETTINGS;
  const { data } = await getServerSupabase().from("settings").select("*").eq("id", 1).maybeSingle();
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
});

export type ProductQuery = {
  categoryIds?: string[];
  collectionId?: string;
  material?: Material;
  featured?: boolean;
  sort?: "new" | "price-asc" | "price-desc";
  limit?: number;
  excludeId?: string;
  ids?: string[];
};

const sortProducts = (list: Product[], sort: ProductQuery["sort"]) => {
  const l = [...list];
  if (sort === "price-asc") l.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") l.sort((a, b) => b.price - a.price);
  else l.sort((a, b) => b.created_at.localeCompare(a.created_at));
  // Sold-out pieces always sink to the end
  return l.sort((a, b) => Number(a.stock === 0) - Number(b.stock === 0));
};

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  if (!supabaseConfigured) {
    let list = demo.products.filter((p) => p.visible);
    if (q.categoryIds) list = list.filter((p) => q.categoryIds!.includes(p.category_id));
    if (q.collectionId) list = list.filter((p) => p.collection_id === q.collectionId);
    if (q.material) list = list.filter((p) => p.material === q.material);
    if (q.featured) list = list.filter((p) => p.featured);
    if (q.excludeId) list = list.filter((p) => p.id !== q.excludeId);
    if (q.ids) list = list.filter((p) => q.ids!.includes(p.id));
    list = sortProducts(list, q.sort);
    return q.limit ? list.slice(0, q.limit) : list;
  }
  let req = getServerSupabase().from("products").select("*").eq("visible", true);
  if (q.categoryIds) req = req.in("category_id", q.categoryIds);
  if (q.collectionId) req = req.eq("collection_id", q.collectionId);
  if (q.material) req = req.eq("material", q.material);
  if (q.featured) req = req.eq("featured", true);
  if (q.excludeId) req = req.neq("id", q.excludeId);
  if (q.ids) req = req.in("id", q.ids);
  if (q.sort === "price-asc") req = req.order("price", { ascending: true });
  else if (q.sort === "price-desc") req = req.order("price", { ascending: false });
  else req = req.order("created_at", { ascending: false });
  if (q.limit) req = req.limit(q.limit * 2);
  const { data, error } = await req;
  if (error) throw error;
  const list = sortProducts(data as Product[], q.sort);
  return q.limit ? list.slice(0, q.limit) : list;
}

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  if (!supabaseConfigured) return demo.products.find((p) => p.slug === slug && p.visible) ?? null;
  const { data } = await getServerSupabase()
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();
  return (data as Product) ?? null;
});

// Helpers over the catalogue -------------------------------------------------

export const topCategories = (c: Catalogue) => c.categories.filter((x) => !x.parent_id);
export const stylesOf = (c: Catalogue, parentId: string) =>
  c.categories.filter((x) => x.parent_id === parentId);
export const collectionsUnder = (c: Catalogue, categoryIds: string[]) =>
  c.collections.filter((x) => categoryIds.includes(x.category_id));

/** The ids of a category and all its styles. */
export const categoryTree = (c: Catalogue, cat: Category) => [
  cat.id,
  ...stylesOf(c, cat.id).map((s) => s.id),
];

/** Breadcrumb trail for a category id: [top, style?]. */
export const categoryPath = (c: Catalogue, categoryId: string): Category[] => {
  const cat = c.categories.find((x) => x.id === categoryId);
  if (!cat) return [];
  if (!cat.parent_id) return [cat];
  const parent = c.categories.find((x) => x.id === cat.parent_id);
  return parent ? [parent, cat] : [cat];
};

export const categoryHref = (c: Catalogue, cat: Category) => {
  const path = categoryPath(c, cat.id);
  return "/" + path.map((p) => p.slug).join("/");
};

/** The style slug used for the placeholder illustration (hoops, jhumkas, rings…). */
export const artKind = (c: Catalogue, p: Product) => {
  const path = categoryPath(c, p.category_id);
  return path.at(-1)?.slug ?? "rings";
};

export const collectionOf = (c: Catalogue, p: Product) =>
  c.collections.find((x) => x.id === p.collection_id) ?? null;
