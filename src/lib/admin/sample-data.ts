import { demo } from "@/lib/demo";
import { samplePhoto } from "@/lib/samples";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category, Collection, HistoryEntry, OrderItem, OrderStatus } from "@/lib/types";

/**
 * Sample products and orders so the store and admin can be previewed before
 * real pieces are added. Everything is tagged so it can be removed in one go:
 * sample products have slugs starting "sample-", sample orders are numbered "DEMO-".
 * Categories and collections are the store's real ones and are left in place.
 */
const PRODUCT_PREFIX = "sample-";
const ORDER_PREFIX = "DEMO-";
const ORDER_COUNT = 48;
export const SAMPLE_COUNTS = { products: demo.products.length, orders: ORDER_COUNT };

const CUSTOMERS = [
  ["Meera Nair", "Kochi", "Kerala", "682001"],
  ["Ananya Rao", "Bengaluru", "Karnataka", "560034"],
  ["Priya Sharma", "Jaipur", "Rajasthan", "302001"],
  ["Kavya Menon", "Chennai", "Tamil Nadu", "600020"],
  ["Riya Das", "Kolkata", "West Bengal", "700019"],
  ["Sneha Patil", "Pune", "Maharashtra", "411004"],
  ["Aisha Khan", "Hyderabad", "Telangana", "500034"],
  ["Divya Iyer", "Mumbai", "Maharashtra", "400050"],
  ["Lakshmi Pillai", "Thiruvananthapuram", "Kerala", "695010"],
  ["Neha Gupta", "Delhi", "Delhi", "110017"],
] as const;

export async function hasSampleData() {
  const { count } = await getBrowserSupabase()
    .from("products")
    .select("id", { count: "exact", head: true })
    .like("slug", `${PRODUCT_PREFIX}%`);
  return (count ?? 0) > 0;
}

export async function addSampleData() {
  const sb = getBrowserSupabase();
  const fail = (what: string, e: { message: string } | null) => {
    if (e) throw new Error(`Could not add sample ${what}: ${e.message}`);
  };

  // 1. Make sure the categories and collections exist, matching by slug
  const [{ data: cats }, { data: cols }] = await Promise.all([
    sb.from("categories").select("*"),
    sb.from("collections").select("*"),
  ]);
  const dbCats = [...((cats as Category[]) ?? [])];
  const dbCols = [...((cols as Collection[]) ?? [])];
  const catMap = new Map<string, string>(); // demo id -> real id
  for (const c of [...demo.categories].sort((a, b) => Number(!!a.parent_id) - Number(!!b.parent_id))) {
    const parent = c.parent_id ? catMap.get(c.parent_id) ?? null : null;
    let real = dbCats.find((x) => x.slug === c.slug && (x.parent_id ?? null) === parent);
    if (!real) {
      const { data, error } = await sb
        .from("categories")
        .insert({ parent_id: parent, name: c.name, slug: c.slug, description: c.description, sort: c.sort })
        .select("*")
        .single();
      fail("categories", error);
      real = data as Category;
      dbCats.push(real);
    }
    catMap.set(c.id, real.id);
  }
  const colMap = new Map<string, string>();
  const missing = demo.collections.filter((c) => !dbCols.some((x) => x.slug === c.slug));
  if (missing.length) {
    const { data, error } = await sb
      .from("collections")
      .insert(missing.map((c) => ({ category_id: catMap.get(c.category_id), name: c.name, slug: c.slug, tagline: c.tagline, story: c.story, sort: c.sort })))
      .select("*");
    fail("collections", error);
    dbCols.push(...((data as Collection[]) ?? []));
  }
  for (const c of demo.collections) {
    const real = dbCols.find((x) => x.slug === c.slug);
    if (real) colMap.set(c.id, real.id);
  }

  // 2. Products with sample photos
  const kindOf = (categoryId: string) => demo.categories.find((c) => c.id === categoryId)?.slug ?? "jhumkas";
  const rows = demo.products.map((p, i) => {
    const photo = samplePhoto(kindOf(p.category_id), p.material) ?? "/samples/jhumka-brass.webp";
    return {
      name: p.name,
      slug: PRODUCT_PREFIX + p.slug,
      category_id: catMap.get(p.category_id),
      collection_id: p.collection_id ? colMap.get(p.collection_id) ?? null : null,
      material: p.material,
      price: p.price,
      compare_at_price: p.compare_at_price,
      stock: i % 9 === 4 ? 0 : i % 7 === 2 ? 1 : p.stock,
      description: p.description,
      details: p.details,
      care: p.care,
      images: [{ url: photo, thumb: photo, alt: p.name }],
      visible: true,
      featured: p.featured,
      sort: p.sort,
      created_at: new Date(Date.now() - (demo.products.length - i) * 36e5 * 30).toISOString(),
    };
  });
  const { error: pe } = await sb.from("products").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
  fail("products", pe);
  const { data: saved } = await sb.from("products").select("id, name, slug, price, material, images").like("slug", `${PRODUCT_PREFIX}%`);
  const products = (saved ?? []) as { id: string; name: string; slug: string; price: number; material: OrderItem["material"]; images: { url: string }[] }[];
  if (!products.length) throw new Error("Could not add sample products.");

  // 3. Orders spread over the last three months, the newest few still to do
  let seed = 11;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const steps: OrderStatus[] = ["new", "confirmed", "paid", "packed", "shipped", "delivered"];
  const recent: OrderStatus[] = ["new", "new", "confirmed", "paid", "packed", "shipped"];
  const hourAgo = (h: number) => new Date(Date.now() - h * 36e5).toISOString();
  const orders = Array.from({ length: ORDER_COUNT }, (_, i) => {
    const hours = i < recent.length ? [1, 4, 9, 22, 30, 52][i] : 60 + rnd() * 24 * 88;
    const status: OrderStatus = i < recent.length ? recent[i] : rnd() > 0.92 ? "cancelled" : "delivered";
    const [customer_name, city, state, pincode] = CUSTOMERS[Math.floor(rnd() * CUSTOMERS.length)];
    const ci = CUSTOMERS.findIndex((c) => c[0] === customer_name);
    const picks = [products[Math.floor(rnd() * products.length)]];
    if (rnd() > 0.6) picks.push(products[Math.floor(rnd() * products.length)]);
    const items: OrderItem[] = [...new Map(picks.map((p) => [p.id, p])).values()].map((p) => ({
      product_id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      qty: rnd() > 0.8 ? 2 : 1,
      image: p.images[0]?.url ?? "",
      material: p.material,
    }));
    const subtotal = items.reduce((n, x) => n + x.price * x.qty, 0);
    const shipping = subtotal >= 999 ? 0 : 60;
    const upto = status === "cancelled" ? 1 : steps.indexOf(status);
    const history: HistoryEntry[] = steps.slice(0, upto + 1).map((s, k) => ({ status: s, at: hourAgo(hours - k * 5) }));
    if (status === "cancelled") history.push({ status: "cancelled", at: hourAgo(hours - 8) });
    const shipped = status === "shipped" || status === "delivered";
    return {
      number: `${ORDER_PREFIX}${1000 + ORDER_COUNT - i}`,
      customer_name,
      phone: `90000000${String(ci).padStart(2, "0")}`,
      email: ci % 3 === 0 ? "" : `${customer_name.split(" ")[0].toLowerCase()}@example.com`,
      address: `${12 + ci * 7}, ${["Temple Road", "MG Road", "Lake View Colony", "Station Road", "Gandhi Nagar"][ci % 5]}`,
      city,
      state,
      pincode,
      notes: i === 0 ? "Please gift wrap, it is for my sister's birthday." : "",
      items,
      subtotal,
      shipping,
      total: subtotal + shipping,
      status,
      payment_ref: upto >= 2 && status !== "cancelled" ? String(4000 + Math.floor(rnd() * 5000)) : "",
      courier: shipped ? "Delhivery" : "",
      tracking_number: shipped ? String(1400000000 + Math.floor(rnd() * 9e8)) : "",
      history,
      created_at: hourAgo(hours),
    };
  });
  const { error: oe } = await sb.from("orders").upsert(orders, { onConflict: "number", ignoreDuplicates: true });
  fail("orders", oe);

  // 4. A couple of reviews to approve (skipped if reviews are not switched on yet)
  await sb.from("reviews").insert([
    { product_id: products[0].id, name: "Meera", city: "Kochi", rating: 5, body: "Even prettier in person, and light enough to wear all evening.", status: "pending" },
    { product_id: products[3 % products.length].id, name: "Ananya", city: "Bengaluru", rating: 4, body: "Lovely detailing. Arrived beautifully packed.", status: "pending" },
  ]);
}

export async function removeSampleData() {
  const sb = getBrowserSupabase();
  const o = await sb.from("orders").delete().like("number", `${ORDER_PREFIX}%`);
  if (o.error) throw new Error(o.error.message);
  const p = await sb.from("products").delete().like("slug", `${PRODUCT_PREFIX}%`);
  if (p.error) throw new Error(p.error.message);
}
