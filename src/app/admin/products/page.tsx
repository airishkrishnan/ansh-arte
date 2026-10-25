"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/shell";
import { useCatalogue } from "@/components/admin/use-catalogue";
import { formatPrice } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { materialLabel, type Product } from "@/lib/types";

export default function ProductsPage() {
  const { leaves, label, collections } = useCatalogue();
  const [rows, setRows] = useState<Product[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [filter, setFilter] = useState<"all" | "hidden" | "soldout">("all");

  const load = useCallback(async () => {
    let req = getBrowserSupabase().from("products").select("*").order("created_at", { ascending: false }).limit(500);
    if (cat) req = req.eq("category_id", cat);
    if (filter === "hidden") req = req.eq("visible", false);
    if (filter === "soldout") req = req.eq("stock", 0);
    if (q.trim()) req = req.ilike("name", `%${q.trim().replace(/[%,]/g, "")}%`);
    const { data } = await req;
    setRows((data as Product[]) ?? []);
  }, [cat, filter, q]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on filter change
    load();
  }, [load]);

  const toggle = async (p: Product) => {
    setRows((r) => r?.map((x) => (x.id === p.id ? { ...x, visible: !p.visible } : x)) ?? null);
    await getBrowserSupabase().from("products").update({ visible: !p.visible }).eq("id", p.id);
  };

  return (
    <>
      <AdminHeader
        title="Products"
        action={
          <Link href="/admin/products/new" className="btn btn-primary !min-h-9 !px-4">
            + Add
          </Link>
        }
      />
      <div className="space-y-3 p-4 md:p-8">
        <input className="field" type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className="field" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {leaves.map((c) => (
              <option key={c.id} value={c.id}>{label(c.id)}</option>
            ))}
          </select>
          <select className="field" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter">
            <option value="all">All products</option>
            <option value="hidden">Hidden</option>
            <option value="soldout">Sold out</option>
          </select>
        </div>

        {rows === null ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-2xl">No products yet</p>
            <Link href="/admin/products/new" className="btn btn-primary mt-6">Add your first product</Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted">{rows.length} products</p>
            <ul className="divide-y divide-line border border-line bg-paper">
              {rows.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <Link href={`/admin/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="aspect-[4/5] w-14 shrink-0 overflow-hidden bg-sand">
                      {p.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element -- thumbnail
                        <img src={p.images[0].thumb ?? p.images[0].url} alt="" className="size-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate font-medium ${p.visible ? "" : "text-muted line-through"}`}>{p.name}</p>
                      <p className="truncate text-xs text-muted">
                        {collections.find((c) => c.id === p.collection_id)?.name ?? label(p.category_id)} · {materialLabel(p.material)}
                      </p>
                      <p className="text-sm">
                        {formatPrice(p.price)}{" "}
                        <span className={p.stock === 0 ? "font-semibold text-temple" : "text-muted"}>
                          · {p.stock === 0 ? "Sold out" : `${p.stock} in stock`}
                        </span>
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggle(p)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${p.visible ? "bg-success" : "bg-line"}`}
                    aria-label={p.visible ? "Hide from store" : "Show in store"}
                    title={p.visible ? "Visible in store" : "Hidden"}
                  >
                    <span className={`absolute top-0.5 size-5 rounded-full bg-paper shadow transition-all ${p.visible ? "left-[1.375rem]" : "left-0.5"}`} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
