"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminHeader, AdminPage } from "@/components/admin/shell";
import { Card, Icon, OrderPills, SectionTitle, ago, fullFmt } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/icons";
import { formatPrice, whatsappLink, withIndiaCode } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

type Row = Pick<Order, "id" | "number" | "customer_name" | "phone" | "email" | "address" | "city" | "state" | "pincode" | "total" | "status" | "created_at" | "items">;

export default function CustomerPage() {
  const { key } = useParams<{ key: string }>();
  const [orders, setOrders] = useState<Row[] | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    getBrowserSupabase()
      .from("orders")
      .select("id, number, customer_name, phone, email, address, city, state, pincode, total, status, created_at, items")
      .ilike("phone", `%${key.replace(/\D/g, "")}`)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setNow(Date.now());
        setOrders((data as Row[]) ?? []);
      });
  }, [key]);

  if (orders === null) {
    return (
      <>
        <AdminHeader title="Customer" back="/admin/customers" />
        <p className="p-8 text-center text-sm text-muted">Loading…</p>
      </>
    );
  }
  const latest = orders[0];
  if (!latest) {
    return (
      <>
        <AdminHeader title="Customer" back="/admin/customers" />
        <p className="p-8 text-center text-sm text-muted">No orders found for this customer.</p>
      </>
    );
  }

  const paid = orders.filter((o) => !["new", "confirmed", "cancelled"].includes(o.status));
  const spent = paid.reduce((n, o) => n + o.total, 0);
  const pieces = orders.filter((o) => o.status !== "cancelled").reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0);
  const email = orders.find((o) => o.email)?.email ?? "";
  const addresses = [...new Map(orders.map((o) => [`${o.address}|${o.pincode}`, o])).values()];
  const first = latest.customer_name.split(" ")[0];
  const wa = whatsappLink(withIndiaCode(latest.phone), `Hi ${first}! This is Ansh Arte 😊 `);

  return (
    <>
      <AdminHeader title={latest.customer_name} back="/admin/customers" />
      <AdminPage narrow>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brass to-brass-deep text-xl font-semibold text-paper">
              {latest.customer_name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{latest.customer_name}</p>
              <p className="text-sm text-muted">
                {latest.city}, {latest.state} · customer since {fullFmt.format(new Date(orders.at(-1)!.created_at))}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl bg-ivory py-3 text-center">
            <div>
              <p className="text-xl font-semibold">{orders.length}</p>
              <p className="text-xs text-muted">{orders.length === 1 ? "Order" : "Orders"}</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{formatPrice(spent)}</p>
              <p className="text-xs text-muted">Spent</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{pieces}</p>
              <p className="text-xs text-muted">Pieces</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <a href={wa} target="_blank" rel="noopener" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#e6f2ea] font-semibold text-[#17603c]">
              <WhatsAppIcon className="size-5" /> Chat
            </a>
            <a href={`tel:${latest.phone}`} className="flex h-12 items-center justify-center gap-2 rounded-full bg-sand/70 font-semibold">
              <Icon name="phone" /> Call
            </a>
            {email ? (
              <a href={`mailto:${email}`} className="flex h-12 items-center justify-center gap-2 rounded-full bg-sand/70 font-semibold">
                <Icon name="mail" /> Email
              </a>
            ) : (
              <span className="flex h-12 items-center justify-center gap-2 rounded-full bg-sand/30 font-semibold text-muted/60">
                <Icon name="mail" /> Email
              </span>
            )}
          </div>
        </Card>

        <section>
          <SectionTitle title="Contact" />
          <Card className="divide-y divide-line text-[0.95rem]">
            <p className="flex justify-between gap-4 p-4"><span className="text-muted">Phone</span>{latest.phone}</p>
            {email && <p className="flex justify-between gap-4 p-4"><span className="text-muted">Email</span><span className="truncate">{email}</span></p>}
            {addresses.map((a) => (
              <div key={a.id} className="p-4">
                <p className="text-sm text-muted">Shipping address</p>
                <p className="mt-1 whitespace-pre-line leading-relaxed">
                  {a.address}
                  {"\n"}
                  {a.pincode} {a.city}, {a.state}
                </p>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <SectionTitle title={`Orders (${orders.length})`} />
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-start gap-3 px-4 py-4 hover:bg-sand/40">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="flex items-baseline gap-2">
                        <span className="font-semibold">{o.number}</span>
                        <span className="text-xs text-muted">{ago(o.created_at, now)}</span>
                      </p>
                      <p className="truncate text-sm text-ink-soft">{o.items.map((i) => i.name).join(", ")}</p>
                      <OrderPills status={o.status} />
                    </div>
                    <p className="font-semibold">{formatPrice(o.total)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </AdminPage>
    </>
  );
}
