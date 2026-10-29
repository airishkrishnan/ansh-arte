"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AdminHeader, AdminPage } from "@/components/admin/shell";
import { ButtonGroup, Card, Icon, RoundButton, SearchPill, Tabs } from "@/components/admin/ui";
import { useCatalogue } from "@/components/admin/use-catalogue";
import { formatPrice } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { materialLabel, type Product } from "@/lib/types";

type TabKey = "all" | "active" | "hidden" | "low" | "nophoto";
type Sort = "new" | "name" | "price" | "stock";
const SORTS: { key: Sort; label: string }[] = [
  { key: "new", label: "Newest" },
  { key: "name", label: "Name A–Z" },
  { key: "price", label: "Price, low to high" },
  { key: "stock", label: "Stock, lowest first" },
];

export default function ProductsPage() {
  return (
    <Suspense>
      <Products />
    </Suspense>
  );
}

function Products() {
  const params = useSearchParams();
  const fromUrl = params.get("tab") as TabKey | null;
  const { leaves, label, collections } = useCatalogue();
  const [all, setAll] = useState<Product[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [tab, setTab] = useState<TabKey>(fromUrl ?? "all");
  const [sort, setSort] = useState<Sort>("new");
  const [showSort, setShowSort] = useState(false);

  const [lastTab, setLastTab] = useState(fromUrl);
  if (fromUrl !== lastTab) {
    setLastTab(fromUrl);
    if (fromUrl) setTab(fromUrl);
  }

  const load = useCallback(async () => {
    const { data } = await getBrowserSupabase().from("products").select("*").order("created_at", { ascending: false }).limit(1000);
    setAll((data as Product[]) ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
  }, [load]);

  const inTab = (p: Product, t: TabKey) =>
    t === "all" ||
    (t === "active" && p.visible && p.stock > 0) ||
    (t === "hidden" && !p.visible) ||
    (t === "low" && p.stock <= 2) ||
    (t === "nophoto" && p.images.length === 0);

  const s = q.trim().toLowerCase();
  const rows = (all ?? [])
    .filter((p) => inTab(p, tab) && (!cat || p.category_id === cat) && (!s || p.name.toLowerCase().includes(s)))
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : sort === "price" ? a.price - b.price : sort === "stock" ? a.stock - b.stock : 0,
    );
  const count = (t: TabKey) => (all ?? []).filter((p) => inTab(p, t)).length;
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "hidden", label: "Hidden" },
    { key: "low", label: "Low stock", count: count("low") },
    { key: "nophoto", label: "No photo", count: count("nophoto") },
  ];

  return (
    <>
      <AdminHeader
        title="Products"
        action={
          <ButtonGroup>
            <RoundButton icon="plusCircle" label="Add product" href="/admin/products/new" />
            <RoundButton icon="catalogue" label="Categories and collections" href="/admin/catalogue" />
          </ButtonGroup>
        }
      />
      <AdminPage>
        <SearchPill value={q} onChange={setQ} placeholder="Search products">
          <button type="button" onClick={() => setShowSort((v) => !v)} className={`grid size-10 place-items-center rounded-full ${showSort || sort !== "new" ? "bg-sand text-ink" : "text-ink-soft"}`} aria-label="Sort" aria-expanded={showSort}>
            <Icon name="sort" />
          </button>
          <label className={`relative grid size-10 place-items-center rounded-full ${cat ? "bg-sand text-ink" : "text-ink-soft"}`} title="Filter by category">
            <Icon name="filter" />
            <select className="absolute inset-0 cursor-pointer opacity-0" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              {leaves.map((c) => (
                <option key={c.id} value={c.id}>{label(c.id)}</option>
              ))}
            </select>
          </label>
        </SearchPill>

        {showSort && (
          <Card className="flex flex-wrap gap-2 p-3">
            {SORTS.map((x) => (
              <button key={x.key} type="button" onClick={() => setSort(x.key)} className="chip !rounded-full text-sm" aria-current={sort === x.key}>
                {x.label}
              </button>
            ))}
          </Card>
        )}
        {cat && (
          <button type="button" onClick={() => setCat("")} className="chip text-sm" aria-current="true">
            {label(cat)} <Icon name="close" className="ml-2 size-4" />
          </button>
        )}

        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        {all === null ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : all.length === 0 ? (
          <Card className="px-6 py-14 text-center">
            <p className="font-serif text-2xl">No products yet</p>
            <Link href="/admin/products/new" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 font-semibold text-paper">
              Add your first product
            </Link>
          </Card>
        ) : rows.length === 0 ? (
          <Card className="px-6 py-14 text-center text-sm text-muted">Nothing matches. Try another tab or search.</Card>
        ) : (
          <>
            <p className="px-1 text-sm text-muted">{rows.length} {rows.length === 1 ? "product" : "products"}</p>
            <Card className="overflow-hidden">
              <ul className="divide-y divide-line">
                {rows.map((p) => {
                  const dot = !p.visible ? "bg-muted/40" : p.stock === 0 ? "bg-temple" : p.stock <= 2 ? "bg-[#d39b3a]" : "bg-[#5aa865]";
                  const state = !p.visible ? "Hidden" : p.stock === 0 ? "Sold out" : p.stock <= 2 ? "Low stock" : "Active";
                  return (
                    <li key={p.id}>
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-sand/40">
                        <span className="size-[4.25rem] shrink-0 overflow-hidden rounded-2xl border border-line bg-sand shadow-[0_2px_6px_rgba(33,27,26,0.06)]">
                          {p.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element -- thumbnail
                            <img src={p.images[0].thumb ?? p.images[0].url} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="grid size-full place-items-center text-muted/60">
                              <Icon name="camera" className="size-6" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[1.05rem] font-medium ${p.visible ? "" : "text-muted"}`}>{p.name}</span>
                          <span className="block truncate text-sm text-muted">
                            {collections.find((c) => c.id === p.collection_id)?.name ?? label(p.category_id)} · {materialLabel(p.material)}
                          </span>
                          <span className="block text-sm">
                            {formatPrice(p.price)}
                            <span className={p.stock === 0 ? "font-semibold text-temple" : p.stock <= 2 ? "font-semibold text-brass-deep" : "text-muted"}>
                              {" "}· {p.stock === 0 ? "Sold out" : `${p.stock} in stock`}
                            </span>
                          </span>
                        </span>
                        <span className={`size-3 shrink-0 rounded-full ${dot}`} title={state} aria-label={state} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </>
        )}
      </AdminPage>
    </>
  );
}
