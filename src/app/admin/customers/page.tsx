"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminHeader, AdminPage } from "@/components/admin/shell";
import { Card, Icon, SearchPill, Tabs, ago, customerKey } from "@/components/admin/ui";
import { formatPrice } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

type Src = Pick<Order, "customer_name" | "phone" | "city" | "total" | "status" | "created_at">;
export type Customer = {
  key: string;
  name: string;
  phone: string;
  city: string;
  orders: number;
  spent: number;
  last: string;
  unpaid: boolean;
};

type TabKey = "all" | "repeat" | "unpaid" | "new";

/** Everyone who has ordered, built from the orders (one row per phone number). */
export default function CustomersPage() {
  const [list, setList] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [now, setNow] = useState(0);

  useEffect(() => {
    getBrowserSupabase()
      .from("orders")
      .select("customer_name, phone, city, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5000)
      .then(({ data }) => {
        const map = new Map<string, Customer>();
        for (const o of (data as Src[]) ?? []) {
          const key = customerKey(o.phone);
          const c = map.get(key) ?? { key, name: o.customer_name, phone: o.phone, city: o.city, orders: 0, spent: 0, last: o.created_at, unpaid: false };
          c.orders += 1;
          if (!["new", "confirmed", "cancelled"].includes(o.status)) c.spent += o.total;
          if (o.status === "confirmed") c.unpaid = true;
          map.set(key, c);
        }
        setNow(Date.now());
        setList([...map.values()]);
      });
  }, []);

  const s = q.trim().toLowerCase();
  const month = now - 30 * 86400000;
  const rows = (list ?? []).filter(
    (c) =>
      (tab === "all" || (tab === "repeat" && c.orders > 1) || (tab === "unpaid" && c.unpaid) || (tab === "new" && new Date(c.last).getTime() > month && c.orders === 1)) &&
      (!s || c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.city.toLowerCase().includes(s)),
  );
  const repeat = (list ?? []).filter((c) => c.orders > 1).length;
  const total = list?.length ?? 0;

  return (
    <>
      <AdminHeader title="Customers" />
      <AdminPage>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <Stat label="Customers" value={String(total)} />
          <Stat label="Came back" value={total ? `${Math.round((repeat / total) * 100)}%` : "–"} />
          <Stat label="Average spend" value={total ? formatPrice(Math.round((list ?? []).reduce((n, c) => n + c.spent, 0) / total)) : "–"} />
        </div>
        <SearchPill value={q} onChange={setQ} placeholder="Search name, phone or city" />
        <Tabs
          tabs={[
            { key: "all", label: "All" },
            { key: "repeat", label: "Repeat buyers" },
            { key: "new", label: "New this month" },
            { key: "unpaid", label: "Waiting to pay" },
          ]}
          value={tab}
          onChange={setTab}
        />
        {list === null ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <Card className="px-6 py-14 text-center text-sm text-muted">{total ? "Nobody matches yet." : "Customers appear here after their first order."}</Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {rows.map((c) => (
                <li key={c.key}>
                  <Link href={`/admin/customers/${c.key}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-sand/40">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brass-soft font-semibold text-brass-deep">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{c.name}</span>
                        {c.orders > 1 && <span className="rounded-full bg-[#d6e8d6] px-2 py-0.5 text-[0.7rem] font-semibold text-[#245631]">Repeat</span>}
                      </span>
                      <span className="block truncate text-sm text-muted">
                        {c.city} · {c.orders} {c.orders === 1 ? "order" : "orders"} · last {ago(c.last, now).toLowerCase()}
                      </span>
                    </span>
                    <span className="text-sm font-semibold">{formatPrice(c.spent)}</span>
                    <Icon name="chevron" className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </AdminPage>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-3 py-3 md:px-5 md:py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold md:text-2xl">{value}</p>
    </Card>
  );
}
