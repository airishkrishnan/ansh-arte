import "server-only";
import type { Catalogue } from "./data";
import { artKind, categoryPath, collectionOf } from "./data";
import { samplePhoto } from "./samples";
import type { SearchItem } from "./search";
import { materialLabel, type Product } from "./types";

export function toSearchItem(c: Catalogue, p: Product): SearchItem {
  const path = categoryPath(c, p.category_id).map((x) => x.name);
  const collection = collectionOf(c, p)?.name ?? "";
  const metal = materialLabel(p.material);
  return {
    slug: p.slug,
    name: p.name,
    price: p.price,
    image: p.images[0]?.thumb ?? p.images[0]?.url ?? samplePhoto(artKind(c, p), p.material),
    meta: [collection, path.at(-1), metal].filter(Boolean).join(" · "),
    text: [p.name, collection, ...path, metal, p.material === "german-silver" ? "silver" : "brass gold"]
      .join(" ")
      .toLowerCase(),
  };
}
