// Sample catalogue shown until Supabase is connected, so the design can be
// reviewed before any real products are uploaded.
import catalogue from "@/data/catalogue.json";
import type { Category, Collection, Material, Product } from "./types";

const categories: Category[] = [];
const collections: Collection[] = [];
const products: Product[] = [];

const names: Record<string, string[]> = {
  hoops: ["Textured Hoop", "Filigree Hoop", "Beaded Hoop"],
  jhumkas: ["Bell Jhumka", "Peacock Jhumka", "Pearl Drop Jhumka"],
  dangles: ["Leaf Drop", "Coin Dangle", "Lotus Drop"],
  studs: ["Petal Stud", "Floral Stud", "Dot Stud"],
  rings: ["Adjustable Ring", "Statement Ring", "Stacking Band"],
};

let n = 0;
const id = (p: string) => `${p}-${(++n).toString().padStart(4, "0")}`;

type SeedCollection = { name: string; slug: string; tagline: string };

function addCollection(c: SeedCollection, categoryId: string, kind: string, sort: number) {
  const col: Collection = {
    id: id("col"),
    category_id: categoryId,
    name: c.name,
    slug: c.slug,
    tagline: c.tagline,
    story: `${c.name} is ${c.tagline.charAt(0).toLowerCase() + c.tagline.slice(1)}. Every piece is finished by hand and oxidised to bring out its fine detail.`,
    banner_url: null,
    sort,
    visible: true,
  };
  collections.push(col);
  const pool = names[kind] ?? names.rings;
  pool.slice(0, 2).forEach((base, i) => {
    const material: Material = (sort + i) % 2 === 0 ? "oxidised-brass" : "german-silver";
    const price = 349 + ((sort * 7 + i * 13 + kind.length * 11) % 9) * 100;
    products.push({
      id: id("prd"),
      name: `${c.name} ${base}`,
      slug: `${c.slug}-${base.toLowerCase().replace(/\s+/g, "-")}`,
      category_id: categoryId,
      collection_id: col.id,
      material,
      price,
      compare_at_price: i === 0 && sort % 2 === 0 ? price + 200 : null,
      stock: (sort + i) % 5 === 4 ? 0 : 3,
      description: `A ${base.toLowerCase()} from our ${c.name} collection, handcrafted in ${material === "oxidised-brass" ? "oxidised brass" : "German silver"}. Lightweight, skin-friendly and made to be worn from day to night.`,
      details: "Length: 4.5 cm\nWeight: 12 g per pair\nClosure: Hook",
      care: "Keep dry and store in an airtight pouch. Wipe gently with a soft cloth after wear. Avoid perfume and water.",
      images: [],
      visible: true,
      featured: i === 0 && sort < 2,
      sort: i,
      created_at: new Date(Date.UTC(2026, 9, 1, (products.length * 37) % 64)).toISOString(),
    });
  });
}

catalogue.categories.forEach((cat, ci) => {
  const top: Category = {
    id: id("cat"),
    parent_id: null,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    image_url: null,
    sort: ci,
    visible: true,
  };
  categories.push(top);
  cat.styles.forEach((st, si) => {
    const style: Category = {
      id: id("cat"),
      parent_id: top.id,
      name: st.name,
      slug: st.slug,
      description: st.description,
      image_url: null,
      sort: si,
      visible: true,
    };
    categories.push(style);
    st.collections.forEach((c, i) => addCollection(c, style.id, st.slug, i));
  });
  (("collections" in cat ? cat.collections : undefined) ?? []).forEach((c, i) => addCollection(c, top.id, cat.slug, i));
});

export const demo = { categories, collections, products };
