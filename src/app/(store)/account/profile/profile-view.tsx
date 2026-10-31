"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/components/account";
import { STATES, lookupPin } from "@/lib/india";
import { getCustomerSupabase } from "@/lib/supabase/client";
import type { Address } from "@/lib/types";

const EMPTY = { name: "", phone: "", address: "", city: "", state: "", pincode: "" };

export function ProfileView() {
  const account = useAccount();
  const router = useRouter();

  return (
    <div className="grid gap-12 md:grid-cols-[1fr_1.3fr] md:gap-16">
      <Details />
      <Addresses />
      <section className="space-y-3 border-t border-line pt-8 text-sm md:col-span-2 md:mx-auto md:w-full md:max-w-sm">
        <button
          type="button"
          className="btn btn-outline w-full"
          onClick={async () => {
            await account.signOut();
            router.replace("/");
          }}
        >
          Sign out
        </button>
        <DeleteAccount />
      </section>
    </div>
  );
}

function Details() {
  const { profile, saveProfile, user } = useAccount();
  const [form, setForm] = useState(profile);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        if (form.phone && !/^[0-9+ ]{10,15}$/.test(form.phone)) return setError("Enter a 10-digit mobile number");
        setState("saving");
        const err = await saveProfile(form);
        if (err) {
          setError(err);
          setState("idle");
        } else setState("saved");
      }}
    >
      <h2 className="eyebrow mb-4">Your details</h2>
      <div>
        <label className="label" htmlFor="p-name">Full name</label>
        <input
          id="p-name"
          className="field"
          autoComplete="name"
          value={form.name}
          onChange={(e) => (setForm({ ...form, name: e.target.value }), setState("idle"))}
        />
      </div>
      <div>
        <label className="label" htmlFor="p-phone">WhatsApp / mobile number</label>
        <input
          id="p-phone"
          className="field"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="10-digit mobile"
          value={form.phone}
          onChange={(e) => (setForm({ ...form, phone: e.target.value }), setState("idle"))}
        />
        <p className="mt-1.5 text-xs text-muted">We use this for order updates on WhatsApp.</p>
      </div>
      <div>
        <p className="label">Email</p>
        <p className="text-sm text-ink-soft">{user?.email}</p>
      </div>
      {error && <p className="text-sm text-temple">{error}</p>}
      <button className="btn btn-primary w-full" disabled={state === "saving"}>
        {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Save details"}
      </button>
    </form>
  );
}

function Addresses() {
  const [list, setList] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<Address | "new" | null>(null);

  const load = useCallback(async () => {
    const { data } = await getCustomerSupabase()
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setList((data ?? []) as Address[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load saved addresses once
    load();
  }, [load]);

  const makeDefault = async (id: string) => {
    const t = getCustomerSupabase().from("addresses");
    await t.update({ is_default: false }).neq("id", id);
    await getCustomerSupabase().from("addresses").update({ is_default: true }).eq("id", id);
    load();
  };
  const remove = async (a: Address) => {
    if (!window.confirm(`Delete the address for ${a.name}?`)) return;
    await getCustomerSupabase().from("addresses").delete().eq("id", a.id);
    load();
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="eyebrow">Saved addresses</h2>
        {editing === null && (
          <button type="button" className="text-sm font-semibold text-brass-deep underline underline-offset-4" onClick={() => setEditing("new")}>
            + Add address
          </button>
        )}
      </div>

      {editing !== null && (
        <AddressForm
          initial={editing === "new" ? null : editing}
          isFirst={!list?.length}
          onDone={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {list === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : list.length === 0 && editing === null ? (
        <p className="border border-dashed border-line p-6 text-center text-sm text-ink-soft">
          No saved addresses yet. Addresses you use at checkout are saved here too.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id} className="border border-line bg-paper p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{a.name}</p>
                {a.is_default && (
                  <span className="bg-brass-soft px-2 py-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brass-deep">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-1 leading-relaxed text-ink-soft">
                {a.address}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                {a.phone}
              </p>
              <div className="mt-3 flex gap-4 text-xs font-semibold">
                <button type="button" className="underline underline-offset-4" onClick={() => setEditing(a)}>
                  Edit
                </button>
                {!a.is_default && (
                  <button type="button" className="underline underline-offset-4" onClick={() => makeDefault(a.id)}>
                    Make default
                  </button>
                )}
                <button type="button" className="text-temple underline underline-offset-4" onClick={() => remove(a)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AddressForm({ initial, isFirst, onDone }: { initial: Address | null; isFirst: boolean; onDone: () => void }) {
  const { profile } = useAccount();
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, phone: initial.phone, address: initial.address, city: initial.city, state: initial.state, pincode: initial.pincode }
      : { ...EMPTY, name: profile.name, phone: profile.phone },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      className="mb-6 space-y-4 border border-ink/20 bg-paper p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const t = getCustomerSupabase().from("addresses");
        const { error } = initial
          ? await t.update(form).eq("id", initial.id)
          : await t.insert({ ...form, is_default: isFirst });
        setBusy(false);
        if (error) return setError("Please check the phone number and PIN code.");
        onDone();
      }}
    >
      <p className="font-serif text-xl">{initial ? "Edit address" : "New address"}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="a-name">Name</label>
          <input id="a-name" className="field" required maxLength={80} autoComplete="name" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="label" htmlFor="a-phone">Phone</label>
          <input id="a-phone" className="field" required type="tel" inputMode="tel" pattern="[0-9+ ]{10,15}" autoComplete="tel" value={form.phone} onChange={set("phone")} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="a-address">House, street, area</label>
        <textarea id="a-address" className="field min-h-20" required maxLength={300} autoComplete="street-address" value={form.address} onChange={set("address")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="a-pin">PIN code</label>
          <input
            id="a-pin"
            className="field"
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="postal-code"
            value={form.pincode}
            onChange={async (e) => {
              const pin = e.target.value.replace(/\D/g, "");
              setForm((f) => ({ ...f, pincode: pin }));
              const found = await lookupPin(pin);
              if (found) setForm((f) => ({ ...f, city: f.city || found.city, state: found.state || f.state }));
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor="a-city">City</label>
          <input id="a-city" className="field" required maxLength={60} autoComplete="address-level2" value={form.city} onChange={set("city")} />
        </div>
        <div>
          <label className="label" htmlFor="a-state">State</label>
          <select id="a-state" className="field" required value={form.state} onChange={set("state")}>
            <option value="">Select</option>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-temple">{error}</p>}
      <div className="flex gap-3">
        <button className="btn btn-primary flex-1" disabled={busy}>
          {busy ? "Saving…" : "Save address"}
        </button>
        <button type="button" className="btn btn-outline" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function DeleteAccount() {
  const { signOut } = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="w-full py-2 text-xs text-muted underline underline-offset-4 hover:text-temple"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm("Delete your account? Your wishlist and saved addresses will be removed. This can't be undone.")) return;
        setBusy(true);
        const { error } = await getCustomerSupabase().rpc("delete_my_account");
        if (error) {
          setBusy(false);
          window.alert("Sorry, that didn't work. Please message us on WhatsApp and we'll delete it for you.");
          return;
        }
        await signOut();
        router.replace("/");
      }}
    >
      {busy ? "Deleting…" : "Delete my account"}
    </button>
  );
}
