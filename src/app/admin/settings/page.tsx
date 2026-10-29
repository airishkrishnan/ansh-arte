"use client";

import { useEffect, useState } from "react";
import { SampleData } from "@/components/admin/sample-data";
import { AdminHeader, useAdmin } from "@/components/admin/shell";
import { DEFAULT_SETTINGS } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const { session, signOut } = useAdmin();
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getBrowserSupabase()
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => data && setS({ ...DEFAULT_SETTINGS, ...data }));
  }, []);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setMsg("");
    setS((x) => ({ ...x, [k]: v }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await getBrowserSupabase()
      .from("settings")
      .update({ ...s, whatsapp_number: s.whatsapp_number.replace(/\D/g, "") })
      .eq("id", 1);
    setBusy(false);
    setMsg(error ? error.message : "Saved ✓");
  };

  const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;

  return (
    <>
      <AdminHeader title="Settings" />
      <form onSubmit={save} className="mx-auto max-w-3xl space-y-5 px-4 pb-8 pt-2 md:px-8 md:pt-4">
        <section className="space-y-4 rounded-[1.75rem] border border-line bg-paper p-4 md:p-6">
          <p className="eyebrow">Orders & payment</p>
          <div>
            <label className="label" htmlFor="wa">WhatsApp number for orders (with 91)</label>
            <input id="wa" className="field" inputMode="tel" value={s.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="upi">UPI ID</label>
              <input id="upi" className="field" value={s.upi_id} onChange={(e) => set("upi_id", e.target.value.trim())} />
            </div>
            <div>
              <label className="label" htmlFor="gp">GPay number</label>
              <input id="gp" className="field" inputMode="tel" value={s.gpay_number} onChange={(e) => set("gpay_number", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="un">Name shown in UPI apps</label>
            <input id="un" className="field" value={s.upi_name} onChange={(e) => set("upi_name", e.target.value)} />
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-line bg-paper p-4 md:p-6">
          <p className="eyebrow">Shipping</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="sf">Shipping fee (₹)</label>
              <input id="sf" className="field" inputMode="numeric" value={s.shipping_fee} onChange={(e) => set("shipping_fee", num(e.target.value))} />
            </div>
            <div>
              <label className="label" htmlFor="fs">Free above (₹)</label>
              <input id="fs" className="field" inputMode="numeric" value={s.free_shipping_above} onChange={(e) => set("free_shipping_above", num(e.target.value))} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-line bg-paper p-4 md:p-6">
          <p className="eyebrow">Store</p>
          <div>
            <label className="label" htmlFor="an">Announcement bar</label>
            <input id="an" className="field" value={s.announcement} onChange={(e) => set("announcement", e.target.value)} placeholder="Leave empty to hide" />
          </div>
          <div>
            <label className="label" htmlFor="ig">Instagram handle</label>
            <input id="ig" className="field" value={s.instagram} onChange={(e) => set("instagram", e.target.value.trim())} placeholder="@anshhartejewels" />
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-line bg-paper p-4 md:p-6">
          <div className="space-y-1">
            <p className="eyebrow">Business details</p>
            <p className="text-xs text-muted">
              Indian e-commerce rules ask online shops to show these. They appear in the footer, on Contact us and on
              the policy pages.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="ln">Business or owner&apos;s legal name</label>
            <input id="ln" className="field" value={s.legal_name} onChange={(e) => set("legal_name", e.target.value)} placeholder="As on your PAN or GST" />
          </div>
          <div>
            <label className="label" htmlFor="ba">Business address</label>
            <textarea id="ba" className="field min-h-20" value={s.business_address} onChange={(e) => set("business_address", e.target.value)} placeholder="Street, city, state, PIN code" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="se">Customer care email</label>
              <input id="se" className="field" type="email" value={s.support_email} onChange={(e) => set("support_email", e.target.value.trim())} />
            </div>
            <div>
              <label className="label" htmlFor="go">Grievance officer name</label>
              <input id="go" className="field" value={s.grievance_officer} onChange={(e) => set("grievance_officer", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="gst">GSTIN (if registered)</label>
            <input id="gst" className="field" value={s.gstin} onChange={(e) => set("gstin", e.target.value.trim().toUpperCase())} placeholder="Leave empty if not registered" />
          </div>
        </section>

        <div className="space-y-2">
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
          {msg && <p className="text-center text-sm">{msg}</p>}
        </div>

        <section className="space-y-3 rounded-[1.75rem] border border-line bg-paper p-4 md:p-6 text-sm leading-relaxed">
          <p className="eyebrow">New-order notifications</p>
          <p>
            Get a phone notification for every order with the free <strong>ntfy</strong> app:
          </p>
          <ol className="ml-5 list-decimal space-y-1 text-ink-soft">
            <li>Install &ldquo;ntfy&rdquo; from the Play Store or App Store.</li>
            <li>Tap + and subscribe to your private topic name (the NTFY_TOPIC value from setup).</li>
            <li>Place a test order: the notification opens the order here.</li>
          </ol>
          <p className="text-ink-soft">
            Add this admin to your home screen (browser menu → Add to Home screen) so it opens like an app.
          </p>
        </section>

        <section className="space-y-3">
          <p className="eyebrow px-1">Sample data</p>
          <SampleData />
        </section>

        <div className="flex items-center justify-between text-sm text-muted">
          <span>Signed in as {session.user.email}</span>
          <button type="button" onClick={signOut} className="underline underline-offset-4">Sign out</button>
        </div>
      </form>
    </>
  );
}
