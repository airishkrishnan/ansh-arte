"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/shell";
import { SITE_URL, whatsappLink } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Review, StockAlert } from "@/lib/types";

type ProductRef = { id: string; name: string; slug: string; stock: number };
type ReviewRow = Review & { products: ProductRef | null };
type AlertRow = StockAlert & { products: ProductRef | null };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const SETUP_HINT = "Reviews and alerts are not switched on yet. In Supabase, open SQL Editor, paste all of supabase/reviews-and-alerts.sql and press Run.";

export default function InboxPage() {
  const [tab, setTab] = useState<"reviews" | "alerts">("reviews");
  const [status, setStatus] = useState<Review["status"]>("pending");
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const sb = getBrowserSupabase();
    const [r, a] = await Promise.all([
      sb.from("reviews").select("*, products(id, name, slug, stock)").eq("status", status).order("created_at", { ascending: false }).limit(200),
      sb.from("stock_alerts").select("*, products(id, name, slug, stock)").is("notified_at", null).order("created_at", { ascending: false }).limit(300),
    ]);
    setError(r.error || a.error ? SETUP_HINT : "");
    setReviews((r.data as ReviewRow[]) ?? []);
    setAlerts((a.data as AlertRow[]) ?? []);
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on filter change
    load();
  }, [load]);

  const setReviewStatus = async (r: ReviewRow, next: Review["status"]) => {
    setReviews((rows) => rows?.filter((x) => x.id !== r.id) ?? null);
    await getBrowserSupabase().from("reviews").update({ status: next }).eq("id", r.id);
  };
  const removeReview = async (r: ReviewRow) => {
    if (!confirm(`Delete this review from ${r.name}? This cannot be undone.`)) return;
    setReviews((rows) => rows?.filter((x) => x.id !== r.id) ?? null);
    await getBrowserSupabase().from("reviews").delete().eq("id", r.id);
  };
  const markNotified = async (a: AlertRow) => {
    setAlerts((rows) => rows?.filter((x) => x.id !== a.id) ?? null);
    await getBrowserSupabase().from("stock_alerts").update({ notified_at: new Date().toISOString() }).eq("id", a.id);
  };

  return (
    <>
      <AdminHeader title="Reviews and alerts" />
      <div className="mx-auto max-w-5xl space-y-5 px-4 pb-8 pt-2 md:px-8 md:pt-4">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="chip justify-center" aria-current={tab === "reviews"} onClick={() => setTab("reviews")}>
            Reviews
          </button>
          <button type="button" className="chip justify-center" aria-current={tab === "alerts"} onClick={() => setTab("alerts")}>
            Back in stock {alerts && alerts.length > 0 ? `(${alerts.length})` : ""}
          </button>
        </div>
        {error && <p className="border border-temple/30 bg-temple/5 p-3 text-sm text-temple">{error}</p>}

        {tab === "reviews" ? (
          <>
            <select className="field" value={status} onChange={(e) => setStatus(e.target.value as Review["status"])} aria-label="Show reviews">
              <option value="pending">Waiting for approval</option>
              <option value="approved">Live on the site</option>
              <option value="hidden">Hidden</option>
            </select>
            {reviews === null ? (
              <p className="py-10 text-center text-sm text-muted">Loading…</p>
            ) : reviews.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted">No reviews here yet.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="space-y-3 rounded-[1.75rem] border border-line bg-paper p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-brass" aria-label={`${r.rating} stars`}>
                          {"★".repeat(r.rating)}
                          <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                        </p>
                        <p className="truncate text-xs text-muted">
                          {r.products?.name ?? "Deleted product"} · {dateFmt.format(new Date(r.created_at))}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-medium">
                        {r.name}
                        {r.city && <span className="block text-xs font-normal text-muted">{r.city}</span>}
                      </p>
                    </div>
                    <p className="text-sm leading-relaxed text-ink-soft">{r.body}</p>
                    {r.photos.length > 0 && (
                      <div className="flex gap-2">
                        {r.photos.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noopener" className="size-20 overflow-hidden bg-sand">
                            {/* eslint-disable-next-line @next/next/no-img-element -- review photo */}
                            <img src={url} alt="" className="size-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {r.status !== "approved" && (
                        <button className="btn btn-primary !min-h-9 !px-4" onClick={() => setReviewStatus(r, "approved")}>
                          Approve
                        </button>
                      )}
                      {r.status !== "hidden" && (
                        <button className="btn btn-outline !min-h-9 !px-4" onClick={() => setReviewStatus(r, "hidden")}>
                          Hide
                        </button>
                      )}
                      <button className="ml-auto text-xs text-temple underline underline-offset-4" onClick={() => removeReview(r)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : alerts === null ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            No one is waiting. When a shopper taps “Notify me” on a sold-out piece, they show up here.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted">
              Restock the piece in Products first, then tap Message to send a ready-made WhatsApp from your phone.
            </p>
            <ul className="divide-y divide-line overflow-hidden rounded-[1.75rem] border border-line bg-paper">
              {alerts.map((a) => {
                const p = a.products;
                const back = (p?.stock ?? 0) > 0;
                const text = `Hi ${a.name || "there"}! Good news from Ansh Arte: "${p?.name}" is back in stock. Shop it here before it goes again:\n${SITE_URL}/product/${p?.slug}`;
                return (
                  <li key={a.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.name || "Shopper"} · +{a.phone}</p>
                      <p className="truncate text-xs text-muted">
                        {p?.name ?? "Deleted product"} ·{" "}
                        <span className={back ? "font-semibold text-success" : "text-temple"}>{back ? "Back in stock" : "Still sold out"}</span>
                        {" · "}
                        {dateFmt.format(new Date(a.created_at))}
                      </p>
                    </div>
                    <a
                      href={whatsappLink(a.phone, text)}
                      target="_blank"
                      rel="noopener"
                      onClick={() => markNotified(a)}
                      className={`btn !min-h-9 !px-4 ${back ? "btn-whatsapp" : "btn-outline"}`}
                    >
                      Message
                    </a>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
