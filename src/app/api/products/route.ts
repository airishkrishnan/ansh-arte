import { NextResponse } from "next/server";
import { artKind, collectionOf, getCatalogue, getProducts } from "@/lib/data";

const ID = /^[0-9a-z-]{1,64}$/i;

/** Products by id, for the wishlist page: /api/products?ids=a,b,c */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .filter((id) => ID.test(id))
    .slice(0, 100);
  if (ids.length === 0) return NextResponse.json({ products: [] });

  const [catalogue, products] = await Promise.all([getCatalogue(), getProducts({ ids })]);
  // Keep the wishlist's own order (newest saved first)
  const byId = new Map(products.map((p) => [p.id, p]));
  return NextResponse.json({
    products: ids
      .map((id) => byId.get(id))
      .filter((p) => p !== undefined)
      .map((p) => ({ product: p, kind: artKind(catalogue, p), collection: collectionOf(catalogue, p)?.name })),
  });
}
