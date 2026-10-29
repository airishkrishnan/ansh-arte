"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Order, Product } from "@/lib/types";
import { Icon, OrderPills, customerKey, type IconName } from "./ui";

type OrderHit = Pick<Order, "id" | "number" | "customer_name" | "phone" | "city" | "total" | "status">;
type ProductHit = Pick<Product, "id" | "name" | "images" | "price" | "stock" | "visible">;

const QUICK: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin/products/new", label: "Add a product", icon: "plus" },
  { href: "/admin/orders?tab=new", label: "Orders to confirm", icon: "orders" },
  { href: "/admin/customers", label: "Customers", icon: "customers" },
  { href: "/admin/inbox", label: "Reviews and alerts", icon: "inbox" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

/** Full-screen search across orders, products and customers. */
export function AdminSearch({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<OrderHit[]>([]);
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const html = document.documentElement;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const s = q.trim().replace(/[%,()]/g, "");
    if (!s) return;
    let alive = true;
    const t = setTimeout(async () => {
      setBusy(true);
      const sb = getBrowserSupabase();
      const [o, p] = await Promise.all([
        sb
          .from("orders")
          .select("id, number, customer_name, phone, city, total, status")
          .or(`number.ilike.%${s}%,customer_name.ilike.%${s}%,phone.ilike.%${s}%`)
          .order("created_at", { ascending: false })
          .limit(8),
        sb.from("products").select("id, name, images, price, stock, visible").ilike("name", `%${s}%`).limit(8),
      ]);
      if (!alive) return;
      setOrders((o.data as OrderHit[]) ?? []);
      setProducts((p.data as ProductHit[]) ?? []);
      setBusy(false);
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  const has = q.trim().length > 0;
  const customers = [...new Map(orders.map((o) => [customerKey(o.phone), o])).values()].slice(0, 5);
  const empty = has && !busy && !orders.length && !products.length;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ivory animate-[fade_0.15s_ease]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="flex items-center gap-2 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.9rem)] md:px-8 md:pt-6">
        <label className="flex h-14 flex-1 items-center gap-3 rounded-full border border-brass bg-paper px-5 shadow-[0_2px_12px_rgba(33,27,26,0.06)]">
          <Icon name="search" className="size-5 shrink-0 text-muted" />
          <input
            ref={input}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search orders, products, customers"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted/70"
          />
        </label>
        <button type="button" onClick={onClose} className="h-14 px-3 text-sm font-semibold text-brass-deep">
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {!has && (
            <section>
              <p className="mb-2 px-1 text-sm font-semibold text-muted">Go to</p>
              <ul className="overflow-hidden rounded-[1.5rem] border border-line bg-paper">
                {QUICK.map((x) => (
                  <li key={x.href} className="border-b border-line last:border-0">
                    <Link href={x.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-sand/50">
                      <span className="grid size-9 place-items-center rounded-xl bg-sand text-ink-soft">
                        <Icon name={x.icon} className="size-[1.1rem]" />
                      </span>
                      {x.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {has && busy && !orders.length && !products.length && <p className="py-10 text-center text-sm text-muted">Searching…</p>}
          {empty && <p className="py-10 text-center text-sm text-muted">Nothing found for &ldquo;{q.trim()}&rdquo;.</p>}

          {has && orders.length > 0 && (
            <Group title="Orders">
              {orders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sand/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{o.number}</p>
                    <p className="truncate text-sm text-muted">{o.customer_name} · {o.city}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">{formatPrice(o.total)}</span>
                    <OrderPills status={o.status} />
                  </div>
                </Link>
              ))}
            </Group>
          )}

          {has && products.length > 0 && (
            <Group title="Products">
              {products.map((p) => (
                <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sand/50">
                  <span className="size-11 shrink-0 overflow-hidden rounded-xl border border-line bg-sand">
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element -- thumbnail
                      <img src={p.images[0].thumb ?? p.images[0].url} alt="" className="size-full object-cover" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-sm text-muted">
                      {formatPrice(p.price)} · {p.stock === 0 ? "Sold out" : `${p.stock} in stock`}
                      {!p.visible && " · Hidden"}
                    </p>
                  </div>
                </Link>
              ))}
            </Group>
          )}

          {has && customers.length > 0 && (
            <Group title="Customers">
              {customers.map((o) => (
                <Link key={o.phone} href={`/admin/customers/${customerKey(o.phone)}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sand/50">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brass-soft font-semibold text-brass-deep">
                    {o.customer_name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.customer_name}</p>
                    <p className="text-sm text-muted">{o.city}</p>
                  </div>
                </Link>
              ))}
            </Group>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2 px-1 text-sm font-semibold text-muted">{title}</p>
      <div className="divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-paper">{children}</div>
    </section>
  );
}
