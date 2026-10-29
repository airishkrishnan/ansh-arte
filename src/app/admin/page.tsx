"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/shell";
import { Card, Icon, OrderPills, ago, dayFmt, type IconName } from "@/components/admin/ui";
import { Monogram } from "@/components/header";
import { SITE_URL, formatPrice } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Order, Product } from "@/lib/types";

type DashOrder = Pick<Order, "id" | "number" | "customer_name" | "total" | "status" | "created_at" | "items">;
type DashProduct = Pick<Product, "id" | "name" | "stock" | "images" | "visible">;
type Metric = "sales" | "orders" | "aov" | "items";
type Counts = { new: number; confirmed: number; toShip: number; reviews: number | null; alerts: number | null };

const DAY = 86400000;
const PERIODS = [7, 30, 90] as const;
const METRICS: { key: Metric; label: string }[] = [
  { key: "sales", label: "Total sales" },
  { key: "orders", label: "Orders" },
  { key: "aov", label: "Average order" },
  { key: "items", label: "Pieces sold" },
];

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Sales, orders, average order and pieces for the orders placed in [from, to). */
function summarise(list: DashOrder[], from: number, to: number) {
  const inRange = list.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return t >= from && t < to && o.status !== "cancelled";
  });
  const sales = inRange.reduce((n, o) => n + o.total, 0);
  const items = inRange.reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0);
  return { sales, orders: inRange.length, aov: inRange.length ? Math.round(sales / inRange.length) : 0, items, list: inRange };
}

export default function AdminHome() {
  const { session } = useAdmin();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [metric, setMetric] = useState<Metric>("sales");
  const [orders, setOrders] = useState<DashOrder[] | null>(null);
  const [products, setProducts] = useState<DashProduct[]>([]);
  const [counts, setCounts] = useState<Counts>({ new: 0, confirmed: 0, toShip: 0, reviews: null, alerts: null });
  const [now, setNow] = useState(0);

  useEffect(() => {
    const sb = getBrowserSupabase();
    const since = new Date(startOfDay(Date.now()) - 2 * 90 * DAY).toISOString();
    const count = async (q: PromiseLike<{ count: number | null; error: unknown }>) => {
      const { count, error } = await q;
      return error ? null : (count ?? 0);
    };
    Promise.all([
      sb.from("orders").select("id, number, customer_name, total, status, created_at, items").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
      sb.from("orders").select("status").in("status", ["new", "confirmed", "paid", "packed"]).limit(2000),
      sb.from("products").select("id, name, stock, images, visible").limit(1000),
      count(sb.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending")),
      count(sb.from("stock_alerts").select("id", { count: "exact", head: true }).is("notified_at", null)),
    ]).then(([o, open, p, reviews, alerts]) => {
      const active = (open.data ?? []) as { status: string }[];
      setNow(Date.now());
      setOrders((o.data as DashOrder[]) ?? []);
      setProducts((p.data as DashProduct[]) ?? []);
      setCounts({
        new: active.filter((x) => x.status === "new").length,
        confirmed: active.filter((x) => x.status === "confirmed").length,
        toShip: active.filter((x) => x.status === "paid" || x.status === "packed").length,
        reviews,
        alerts,
      });
    });
  }, []);

  const stats = useMemo(() => {
    if (!orders || !now) return null;
    const end = startOfDay(now) + DAY;
    const from = end - days * DAY;
    const cur = summarise(orders, from, end);
    const prev = summarise(orders, from - days * DAY, from);
    const bucket = (list: DashOrder[], start: number) =>
      Array.from({ length: days }, (_, i) => {
        const day = list.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= start + i * DAY && t < start + (i + 1) * DAY;
        });
        const s = summarise(day, -Infinity, Infinity);
        return s[metric];
      });
    // Best sellers by pieces sold in this period
    const sold = new Map<string, { name: string; image: string; qty: number; revenue: number }>();
    for (const o of cur.list)
      for (const i of o.items) {
        const row = sold.get(i.product_id) ?? { name: i.name, image: i.image, qty: 0, revenue: 0 };
        row.qty += i.qty;
        row.revenue += i.qty * i.price;
        sold.set(i.product_id, row);
      }
    return {
      cur,
      prev,
      series: bucket(cur.list, from),
      prevSeries: bucket(prev.list, from - days * DAY),
      from,
      best: [...sold.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 5),
    };
  }, [orders, now, days, metric]);

  const hour = now ? new Date(now).getHours() : 12;
  const greeting = hour < 12 ? "Good morning!" : hour < 17 ? "Good afternoon!" : "Good evening!";
  const email = session.user.email ?? "";
  const lowStock = products.filter((p) => p.visible && p.stock > 0 && p.stock <= 2);
  const soldOut = products.filter((p) => p.visible && p.stock === 0);
  const noPhoto = products.filter((p) => p.images.length === 0);
  const fmt = (m: Metric, v: number) => (m === "sales" || m === "aov" ? formatPrice(v) : v.toLocaleString("en-IN"));
  const alertsWaiting = (counts.reviews ?? 0) + (counts.alerts ?? 0);

  return (
    <div>
      {/* Dark top: store, key numbers and the chart */}
      <section className="bg-ink pb-14 text-paper">
        <div className="mx-auto max-w-5xl px-4 pt-[max(env(safe-area-inset-top),1rem)] md:px-8 md:pt-8">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-brass to-brass-deep text-sm font-semibold uppercase" title={email}>
              {email.slice(0, 2)}
            </span>
            <span className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-paper">
                <Monogram className="h-7 w-5" arch="var(--color-brass)" letter="var(--color-ink)" />
              </span>
              <span className="font-serif text-2xl">Ansh Arte</span>
            </span>
            <Link href="/admin/inbox" className="relative grid size-11 place-items-center rounded-full hover:bg-paper/10" aria-label={`Reviews and alerts${alertsWaiting ? `, ${alertsWaiting} waiting` : ""}`}>
              <Icon name="inbox" className="size-6" />
              {alertsWaiting > 0 && (
                <span className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-brass-soft px-1 text-[0.65rem] font-bold text-ink">{alertsWaiting}</span>
              )}
            </Link>
          </div>

          <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {METRICS.map((m) => {
              const v = stats?.cur[m.key] ?? 0;
              const p = stats?.prev[m.key] ?? 0;
              const change = p ? Math.round(((v - p) / p) * 100) : null;
              const on = metric === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMetric(m.key)}
                  aria-pressed={on}
                  className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition-colors ${on ? "border-paper/15 bg-paper/10" : "border-transparent hover:bg-paper/5"}`}
                >
                  <span className="block text-sm text-paper/60">{m.label}</span>
                  <span className="mt-1 flex items-baseline gap-2">
                    <span className="text-[1.6rem] font-semibold leading-none">{stats ? fmt(m.key, v) : "–"}</span>
                    {change !== null && (
                      <span className={`text-sm font-medium ${change >= 0 ? "text-[#9fd3a8]" : "text-paper/55"}`}>
                        {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <Chart
            series={stats?.series ?? []}
            prev={stats?.prevSeries ?? []}
            from={stats?.from ?? 0}
            money={metric === "sales" || metric === "aov"}
          />

          <div className="mt-5 flex items-center justify-center gap-2">
            <div className="flex rounded-full border border-paper/15 p-1" role="group" aria-label="Period">
              {PERIODS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  aria-pressed={days === d}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors ${days === d ? "bg-paper font-semibold text-ink" : "text-paper/70 hover:text-paper"}`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-paper/45">Solid line: last {days} days · dotted line: the {days} days before</p>
        </div>
      </section>

      {/* Light sheet: what needs doing */}
      <section className="relative -mt-8 rounded-t-[2rem] bg-ivory">
        <div className="mx-auto max-w-5xl space-y-5 px-4 pb-8 pt-7 md:px-8">
          <h2 className="text-xl font-semibold md:text-2xl">
            <span className="text-muted">{greeting}</span> Here&rsquo;s your activity
          </h2>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Todo href="/admin/orders?tab=new" label="Confirm orders" count={counts.new} icon="orders" />
            <Todo href="/admin/orders?tab=confirmed" label="Collect payments" count={counts.confirmed} icon="cash" />
            <Todo href="/admin/orders?tab=paid" label="Pack and ship" count={counts.toShip} icon="truck" />
            <Todo href="/admin/inbox" label="Reviews to approve" count={counts.reviews} icon="star" />
            <Todo href="/admin/inbox" label="Restock requests" count={counts.alerts} icon="inbox" />
            <Todo href="/admin/products?tab=low" label="Low or sold out" count={lowStock.length + soldOut.length} icon="alert" />
          </div>

          {counts.reviews === null && (
            <Tip
              title="Switch on reviews and restock alerts"
              text="One step left in Supabase: open SQL Editor, paste all of supabase/reviews-and-alerts.sql and press Run."
              icon="sparkle"
            />
          )}
          {noPhoto.length > 0 && (
            <Tip
              title={`Add real photos to ${noPhoto.length} ${noPhoto.length === 1 ? "piece" : "pieces"}`}
              text="They show sample pictures in the store right now. A clear photo in daylight on a plain cloth sells far better."
              icon="camera"
              href="/admin/products?tab=nophoto"
              cta="Add photos"
              image="/samples/jhumka-brass.webp"
            />
          )}
          <Tip
            title="Share your store on WhatsApp"
            text="Post your store link to your WhatsApp Status or groups. New pieces sell fastest in the first few days."
            icon="share"
            href={`https://wa.me/?text=${encodeURIComponent(`New handcrafted pieces at Ansh Arte ✨ ${SITE_URL}`)}`}
            cta="Share link"
            external
            image="/samples/banner-silver.webp"
          />

          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold">Latest orders</h2>
                <Link href="/admin/orders?tab=all" className="text-sm font-semibold text-brass-deep">View all</Link>
              </div>
              <Card className="overflow-hidden">
                {orders === null ? (
                  <p className="p-6 text-center text-sm text-muted">Loading…</p>
                ) : orders.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted">Your first order will show up here.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {orders.slice(0, 5).map((o) => (
                      <li key={o.id}>
                        <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-sand/40">
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">{o.number}</span>
                              <span className="text-xs text-muted">{ago(o.created_at, now)}</span>
                            </p>
                            <p className="truncate text-sm text-muted">{o.customer_name}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-semibold">{formatPrice(o.total)}</span>
                            <OrderPills status={o.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold">Best sellers</h2>
                <span className="text-sm text-muted">Last {days} days</span>
              </div>
              <Card className="overflow-hidden">
                {!stats?.best.length ? (
                  <p className="p-6 text-center text-sm text-muted">No sales in this period yet.</p>
                ) : (
                  <ol className="divide-y divide-line">
                    {stats.best.map(([id, b], i) => (
                      <li key={id} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-4 text-sm font-semibold text-muted">{i + 1}</span>
                        <span className="size-11 shrink-0 overflow-hidden rounded-xl border border-line bg-sand">
                          {b.image && (
                            // eslint-disable-next-line @next/next/no-img-element -- thumbnail
                            <img src={b.image} alt="" className="size-full object-cover" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{b.name}</span>
                          <span className="text-sm text-muted">{b.qty} sold</span>
                        </span>
                        <span className="text-sm font-semibold">{formatPrice(b.revenue)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </div>
          </div>

          {lowStock.length + soldOut.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold">Running low</h2>
                <Link href="/admin/products?tab=low" className="text-sm font-semibold text-brass-deep">See all</Link>
              </div>
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:px-0">
                {[...soldOut, ...lowStock].slice(0, 10).map((p) => (
                  <Link key={p.id} href={`/admin/products/${p.id}`} className="w-32 shrink-0">
                    <span className="block aspect-square overflow-hidden rounded-2xl border border-line bg-sand">
                      {p.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element -- thumbnail
                        <img src={p.images[0].thumb ?? p.images[0].url} alt="" className="size-full object-cover" />
                      )}
                    </span>
                    <span className="mt-2 block truncate text-sm font-medium">{p.name}</span>
                    <span className={`text-xs font-semibold ${p.stock === 0 ? "text-temple" : "text-brass-deep"}`}>
                      {p.stock === 0 ? "Sold out" : `Only ${p.stock} left`}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Todo({ href, label, count, icon }: { href: string; label: string; count: number | null; icon: IconName }) {
  const busy = !!count;
  return (
    <Link href={href} className={`rounded-[1.5rem] border p-4 transition-colors md:p-5 ${busy ? "border-line bg-paper hover:border-brass" : "border-line/70 bg-paper/60"}`}>
      <span className="block text-[0.95rem] text-ink-soft">{label}</span>
      <span className="mt-2 flex items-end justify-between">
        <span className={`text-2xl font-semibold ${busy ? "text-ink" : "text-muted/70"}`}>{count ?? "–"}</span>
        <Icon name={icon} className={`size-6 ${busy ? "text-brass-deep" : "text-muted/50"}`} />
      </span>
    </Link>
  );
}

function Tip({
  title,
  text,
  icon,
  href,
  cta,
  external = false,
  image,
}: {
  title: string;
  text: string;
  icon: IconName;
  href?: string;
  cta?: string;
  external?: boolean;
  image?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`relative z-10 p-5 md:p-6 ${image ? "pr-28 sm:pr-48" : ""}`}>
        <p className="flex items-center gap-2 text-lg font-semibold">
          <Icon name={icon} className="size-5 shrink-0 text-brass-deep" />
          {title}
        </p>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{text}</p>
        {href && cta && (
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener" : undefined}
            className="mt-4 inline-flex h-11 items-center rounded-full border border-line bg-ivory px-5 text-sm font-semibold shadow-[0_2px_8px_rgba(33,27,26,0.06)] hover:bg-sand"
          >
            {cta}
          </a>
        )}
      </div>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- decorative
        <img src={image} alt="" className="absolute inset-y-0 right-0 h-full w-24 object-cover [mask-image:linear-gradient(to_right,transparent,black_45%)] sm:w-44" />
      )}
    </Card>
  );
}

/** Line chart: this period solid, the period before dotted. */
function Chart({ series, prev, from, money }: { series: number[]; prev: number[]; from: number; money: boolean }) {
  const W = 600;
  const H = 180;
  const max = Math.max(1, ...series, ...prev);
  const step = niceStep(max / 3);
  const top = step * Math.max(1, Math.ceil(max / step));
  const pts = (s: number[]) =>
    s.map((v, i) => `${(i / Math.max(1, s.length - 1)) * W},${H - (v / top) * H}`).join(" ");
  const ticks = [0, 1, 2, 3].map((i) => (top / 3) * i).filter((v, i, a) => a.indexOf(v) === i);
  const label = (v: number) =>
    money ? (v >= 100000 ? `₹${+(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${+(v / 1000).toFixed(1)}k` : `₹${Math.round(v)}`) : String(Math.round(v));
  const dates = series.length
    ? [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (series.length - 1))).map((i) => ({ i, d: dayFmt.format(new Date(from + i * DAY)) }))
    : [];

  return (
    <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-2">
      <div className="relative h-44 w-11 text-right text-[0.7rem] text-paper/50">
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - (t / top) * 100}%` }}>
            {label(t)}
          </span>
        ))}
      </div>
      <div className="relative h-44">
        {ticks.map((t) => (
          <span key={t} className="absolute inset-x-0 border-t border-paper/10" style={{ top: `${100 - (t / top) * 100}%` }} />
        ))}
        {series.length > 1 && (
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
            <polyline points={pts(prev)} fill="none" stroke="var(--color-silver)" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <polyline points={pts(series)} fill="none" stroke="var(--color-brass-soft)" strokeWidth="2.25" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
      <span />
      <div className="relative mt-2 h-4 text-[0.7rem] text-paper/50">
        {dates.map(({ i, d }, n) => (
          <span
            key={i}
            className={`absolute whitespace-nowrap ${n === 0 ? "" : n === dates.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
            style={{ left: `${(i / Math.max(1, series.length - 1)) * 100}%` }}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

function niceStep(x: number) {
  if (x <= 1) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  const f = x / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}
