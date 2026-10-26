import { NextResponse } from "next/server";
import { getCatalogue, getProducts } from "@/lib/data";
import { toSearchItem } from "@/lib/search-index";

/** The whole (small) catalogue as a search index; the browser filters it as you type. */
export async function GET() {
  const [catalogue, products] = await Promise.all([getCatalogue(), getProducts()]);
  return NextResponse.json(
    products.map((p) => toSearchItem(catalogue, p)),
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
