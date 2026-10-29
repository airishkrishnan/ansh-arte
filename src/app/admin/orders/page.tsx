"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AdminHeader, AdminPage } from "@/components/admin/shell";
import { ButtonGroup, Card, OrderPills, RoundButton, SearchPill, Tabs, ago } from "@/components/admin/ui";
import { formatPrice } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";

type TabKey = "todo" | "new" | "confirmed" | "paid" | "shipped" | "all";
const TABS: { key: TabKey; label: string; statuses: OrderStatus[] }[] = [
  { key: "todo", label: "To do", statuses: ["new", "confirmed", "paid", "packed"] },
  { key: "new", label: "To confirm", statuses: ["new"] },
  { key: "confirmed", label: "Awaiting payment", statuses: ["confirmed"] },
  { key: "paid", label: "To ship", statuses: ["paid", "packed"] },
  { key: "shipped", label: "Shipped", statuses: ["shipped"] },
  { key: "all", label: "All", statuses: [] },
];

type Row = Pick<Order, "id" | "number" | "customer_name" | "city" | "total" | "status" | "created_at" | "items">;

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const params = useSearchParams();
  const router = useRouter();
  const fromUrl = params.get("tab") as TabKey | null;
  const [tab, setTab] = useState<TabKey>(fromUrl && TABS.some((t) => t.key === fromUrl) ? fromUrl : "todo");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [oldest, setOldest] = useState(false);
  const [now, setNow] = useState(0);
  const [stats, setStats] = useState({ today: 0, todayTotal: 0, month: 0 });

  // Menu links (?tab=new) switch tabs while the page stays open
  const [lastTab, setLastTab] = useState(fromUrl);
  if (fromUrl !== lastTab) {
    setLastTab(fromUrl);
    if (fromUrl && TABS.some((t) => t.key === fromUrl)) setTab(fromUrl);
  }

  // Opening a notification link (?n=AA-1001) jumps straight to that order
  useEffect(() => {
    const n = params.get("n");
    if (!n) return;
    getBrowserSupabase()
      .from("orders")
      .select("id")
      .eq("number", n)
      .maybeSingle()
      .then(({ data }) => data && router.replace(`/admin/orders/${data.id}`));
  }, [params, router]);

  const load = useCallback(async () => {
    const sb = getBrowserSupabase();
    const t = TABS.find((x) => x.key === tab)!;
    let req = sb
      .from("orders")
      .select("id, number, customer_name, city, total, status, created_at, items")
      .order("created_at", { ascending: oldest })
      .limit(150);
    if (t.statuses.length) req = req.in("status", t.statuses);
    if (q.trim()) {
      const s = q.trim().replace(/[%,()]/g, "");
      req = req.or(`number.ilike.%${s}%,customer_name.ilike.%${s}%,phone.ilike.%${s}%`);
    }
    const { data } = await req;
    setNow(Date.now());
    setRows((data as Row[]) ?? []);
  }, [tab, q, oldest]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on filter change
    load();
  }, [load]);

  useEffect(() => {
    const sb = getBrowserSupabase();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    sb.from("orders")
      .select("total, created_at, status")
      .gte("created_at", monthStart.toISOString())
      .neq("status", "cancelled")
      .then(({ data }) => {
        const list = data ?? [];
        const paid = list.filter((o) => !["new", "confirmed"].includes(o.status));
        const today = list.filter((o) => new Date(o.created_at) >= start);
        setStats({
          today: today.length,
          todayTotal: today.reduce((n, o) => n + o.total, 0),
          month: paid.reduce((n, o) => n + o.total, 0),
        });
      });
  }, []);

  // Group the list by day, like Shopify
  const groups: { day: string; rows: Row[] }[] = [];
  const dayName = (iso: string) => {
    const d = new Date(iso);
    const today = new Date(now);
    const diff = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return new Intl.DateTimeFormat("en-IN", { weekday: diff < 7 ? "long" : undefined, day: "numeric", month: "short" }).format(d);
  };
  for (const r of rows ?? []) {
    const day = dayName(r.created_at);
    if (groups.at(-1)?.day === day) groups.at(-1)!.rows.push(r);
    else groups.push({ day, rows: [r] });
  }

  return (
    <>
      <AdminHeader
        title="Orders"
        action={
          <ButtonGroup>
            <RoundButton icon="sort" label={oldest ? "Showing oldest first" : "Showing newest first"} onClick={() => setOldest((o) => !o)} />
            <RoundButton icon="clock" label="Refresh" onClick={load} />
          </ButtonGroup>
        }
      />
      <AdminPage>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <Stat label="Orders today" value={String(stats.today)} />
          <Stat label="Sales today" value={formatPrice(stats.todayTotal)} />
          <Stat label="Paid this month" value={formatPrice(stats.month)} />
        </div>
        <SearchPill value={q} onChange={setQ} placeholder="Search order no., name or phone" />
        <Tabs tabs={TABS} value={tab} onChange={setTab} />

        {rows === null ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <Card className="px-6 py-14 text-center">
            <p className="font-serif text-2xl">All caught up</p>
            <p className="mt-2 text-sm text-muted">No orders here right now.</p>
          </Card>
        ) : (
          groups.map((g) => (
            <section key={g.day}>
              <p className="mb-2 px-1 text-sm font-semibold text-muted">{g.day}</p>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-line">
                  {g.rows.map((o) => {
                    const pcs = o.items.reduce((n, i) => n + i.qty, 0);
                    return (
                      <li key={o.id}>
                        <Link href={`/admin/orders/${o.id}`} className="flex items-start gap-3 px-4 py-4 hover:bg-sand/40 active:bg-sand/60">
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="flex items-baseline gap-2">
                              <span className="text-[1.05rem] font-semibold">{o.number}</span>
                              <span className="text-xs text-muted">{ago(o.created_at, now)}</span>
                            </p>
                            <p className="truncate text-sm text-ink-soft">
                              {o.customer_name} · {o.city} · {pcs} {pcs === 1 ? "piece" : "pieces"}
                            </p>
                            <OrderPills status={o.status} />
                          </div>
                          <p className="pt-0.5 font-semibold">{formatPrice(o.total)}</p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          ))
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
