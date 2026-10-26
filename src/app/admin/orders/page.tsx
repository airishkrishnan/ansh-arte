"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatPrice } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";

const TABS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "todo", label: "To do", statuses: ["new", "confirmed", "paid", "packed"] },
  { key: "new", label: "New", statuses: ["new"] },
  { key: "confirmed", label: "Awaiting payment", statuses: ["confirmed"] },
  { key: "paid", label: "To pack", statuses: ["paid", "packed"] },
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
  const [tab, setTab] = useState("todo");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [now, setNow] = useState(0);
  const [stats, setStats] = useState({ today: 0, todayTotal: 0, month: 0 });

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
      .order("created_at", { ascending: false })
      .limit(100);
    if (t.statuses.length) req = req.in("status", t.statuses);
    if (q.trim()) {
      const s = q.trim().replace(/[%,()]/g, "");
      req = req.or(`number.ilike.%${s}%,customer_name.ilike.%${s}%,phone.ilike.%${s}%`);
    }
    const { data } = await req;
    setNow(Date.now());
    setRows((data as Row[]) ?? []);
  }, [tab, q]);

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

  const ago = (iso: string) => {
    const m = Math.round((now - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${m}m ago`;
    if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso));
  };

  return (
    <>
      <AdminHeader
        title="Orders"
        action={
          <button onClick={load} className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-deep">
            Refresh
          </button>
        }
      />
      <div className="space-y-4 p-4 md:p-8">
        <div className="grid grid-cols-3 divide-x divide-brass-soft/15 bg-ink text-brass-soft">
          <Stat label="Orders today" value={String(stats.today)} />
          <Stat label="Today" value={formatPrice(stats.todayTotal)} />
          <Stat label="Paid this month" value={formatPrice(stats.month)} />
        </div>
        <input
          className="field"
          placeholder="Search order no., name or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
        />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className="chip !min-h-9 text-sm" aria-current={tab === t.key}>
              {t.label}
            </button>
          ))}
        </div>

        {rows === null ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">No orders here yet.</p>
        ) : (
          <ul className="divide-y divide-line border border-line bg-paper">
            {rows.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 p-4 active:bg-sand">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{o.number}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-ink-soft">
                      {o.customer_name} · {o.city} · {o.items.reduce((n, i) => n + i.qty, 0)} pcs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(o.total)}</p>
                    <p className="text-xs text-muted">{ago(o.created_at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 md:p-5">
      <p className="text-[0.62rem] uppercase tracking-[0.14em] text-silver">{label}</p>
      <p className="mt-1 font-serif text-xl text-paper md:text-3xl">{value}</p>
    </div>
  );
}
