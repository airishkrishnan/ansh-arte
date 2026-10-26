"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/account";
import { ChevronIcon, TruckIcon } from "@/components/icons";
import { formatPrice } from "@/lib/site";
import { getCustomerSupabase } from "@/lib/supabase/client";
import { ORDER_STEPS, type AccountOrder } from "@/lib/types";

const date = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(
    new Date(iso),
  );

export function MyOrders() {
  const { user } = useAccount();
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getCustomerSupabase()
      .rpc("my_orders")
      .then(({ data, error }) => {
        if (error) setError("We couldn't load your orders. Please refresh the page.");
        setOrders((data as AccountOrder[]) ?? []);
      });
  }, [user]);

  if (!orders) return <p className="py-16 text-center text-sm text-muted">Loading your orders…</p>;
  if (error) return <p className="py-16 text-center text-sm text-temple">{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="border border-line bg-paper px-6 py-16 text-center">
        <p className="font-serif text-3xl">No orders yet</p>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-soft">
          Orders you place while signed in, or earlier with {user?.email}, will show up here.
        </p>
        <Link href="/earrings" className="btn btn-primary mt-8">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => {
        const cancelled = o.status === "cancelled";
        const step = ORDER_STEPS.findIndex((s) => s.status === o.status);
        const pieces = o.items.reduce((n, i) => n + i.qty, 0);
        return (
          <li key={o.number} className="border border-line bg-paper">
            <Link href={`/order/${o.number}?k=${o.key}`} className="block p-5 transition-colors hover:bg-ivory md:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-serif text-2xl">{o.number}</p>
                <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${cancelled ? "text-temple" : "text-brass-deep"}`}>
                  {cancelled ? "Cancelled" : ORDER_STEPS[step]?.customer}
                </p>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {date(o.created_at)} · {pieces} {pieces === 1 ? "piece" : "pieces"} · {formatPrice(o.total)}
              </p>
              <p className="mt-2 line-clamp-1 text-sm text-muted">{o.items.map((i) => i.name).join(", ")}</p>

              {!cancelled && (
                <div className="mt-4 grid grid-cols-6 gap-1" aria-hidden="true">
                  {ORDER_STEPS.map((s, i) => (
                    <span key={s.status} className={`h-1 ${i <= step ? "bg-brass" : "bg-line"}`} />
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                {o.tracking_number ? (
                  <span className="flex items-center gap-2 text-ink-soft">
                    <TruckIcon className="size-4 text-brass" />
                    {o.courier || "Courier"} · {o.tracking_number}
                  </span>
                ) : (
                  <span />
                )}
                <span className="flex items-center gap-1 font-semibold">
                  {o.status === "new" ? "Finish on WhatsApp" : o.status === "confirmed" ? "Pay now" : "View & track"}
                  <ChevronIcon />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
