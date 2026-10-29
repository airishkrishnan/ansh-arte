"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/shell";
import { useCatalogue } from "@/components/admin/use-catalogue";
import { prepareBanner, uploadImage } from "@/lib/admin/image";
import { slugify } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category, Collection } from "@/lib/types";

type Editing =
  | { kind: "category"; item: Partial<Category> }
  | { kind: "collection"; item: Partial<Collection> };

export default function CataloguePage() {
  const { categories, collections, ready, reload } = useCatalogue();
  const [editing, setEditing] = useState<Editing | null>(null);
  const tops = categories.filter((c) => !c.parent_id);

  const Row = ({ name, sub, hidden, onClick }: { name: string; sub?: string; hidden?: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-sand">
      <span className={hidden ? "text-muted line-through" : ""}>
        {name}
        {sub && <span className="block text-xs text-muted">{sub}</span>}
      </span>
      <span className="text-xs text-muted">Edit</span>
    </button>
  );

  const colList = (categoryId: string) =>
    collections
      .filter((c) => c.category_id === categoryId)
      .map((c) => (
        <li key={c.id} className="pl-4">
          <Row name={c.name} sub={c.tagline} hidden={!c.visible} onClick={() => setEditing({ kind: "collection", item: c })} />
        </li>
      ));

  return (
    <>
      <AdminHeader
        title="Catalogue"
        back="/admin/products"
        action={
          <button className="btn btn-primary !min-h-11 !px-5" onClick={() => setEditing({ kind: "category", item: { parent_id: null } })}>
            + Category
          </button>
        }
      />
      <div className="mx-auto max-w-3xl space-y-5 px-4 pb-8 pt-2 md:px-8 md:pt-4">
        <p className="text-sm text-ink-soft">
          Categories (Earrings, Rings, Bangles…) can have styles (Hoops, Jhumkas…). Collections sit inside a style, or
          directly in a category that has no styles.
        </p>
        {!ready && <p className="text-sm text-muted">Loading…</p>}
        {tops.map((top) => {
          const styles = categories.filter((c) => c.parent_id === top.id);
          return (
            <section key={top.id} className="overflow-hidden rounded-[1.75rem] border border-line bg-paper">
              <div className="flex items-center justify-between border-b border-line bg-sand/60 pr-2">
                <div className="flex-1">
                  <Row name={top.name} sub={`/${top.slug}`} hidden={!top.visible} onClick={() => setEditing({ kind: "category", item: top })} />
                </div>
              </div>
              <ul className="divide-y divide-line">
                {styles.map((st) => (
                  <li key={st.id}>
                    <div className="bg-paper">
                      <Row name={`${st.name}`} sub="Style" hidden={!st.visible} onClick={() => setEditing({ kind: "category", item: st })} />
                    </div>
                    <ul className="divide-y divide-line border-t border-line bg-ivory/50">{colList(st.id)}</ul>
                    <button
                      className="w-full border-t border-line py-2 pl-8 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brass-deep"
                      onClick={() => setEditing({ kind: "collection", item: { category_id: st.id, visible: true } })}
                    >
                      + Collection in {st.name}
                    </button>
                  </li>
                ))}
                {styles.length === 0 && (
                  <>
                    {colList(top.id)}
                    <li>
                      <button
                        className="w-full py-2 pl-8 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brass-deep"
                        onClick={() => setEditing({ kind: "collection", item: { category_id: top.id, visible: true } })}
                      >
                        + Collection in {top.name}
                      </button>
                    </li>
                  </>
                )}
                <li>
                  <button
                    className="w-full py-2.5 pl-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                    onClick={() => setEditing({ kind: "category", item: { parent_id: top.id, visible: true } })}
                  >
                    + Style in {top.name}
                  </button>
                </li>
              </ul>
            </section>
          );
        })}
      </div>
      {editing && (
        <Editor
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}

function Editor({ editing, onClose, onSaved }: { editing: Editing; onClose: () => void; onSaved: () => void }) {
  const isCol = editing.kind === "collection";
  const [item, setItem] = useState<Record<string, unknown>>({ visible: true, sort: 0, ...editing.item });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const table = isCol ? "collections" : "categories";
  const imageKey = isCol ? "banner_url" : "image_url";
  const set = (k: string, v: unknown) => setItem((x) => ({ ...x, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const sb = getBrowserSupabase();
    const row = { ...item, slug: (item.slug as string) || slugify(String(item.name ?? "")) };
    const { id, ...rest } = row as { id?: string };
    for (const k of ["created_at"]) delete (rest as Record<string, unknown>)[k];
    const res = id ? await sb.from(table).update(rest).eq("id", id) : await sb.from(table).insert(rest);
    setBusy(false);
    if (res.error) return setError(res.error.code === "23505" ? "That web address is already used. Change the name or address." : res.error.message);
    onSaved();
  };

  const remove = async () => {
    if (!item.id || !confirm(`Delete "${item.name}"?`)) return;
    const res = await getBrowserSupabase().from(table).delete().eq("id", item.id as string);
    if (res.error) {
      return setError(
        res.error.code === "23503"
          ? "Products still use this. Move or delete them first, or just hide it."
          : res.error.message,
      );
    }
    onSaved();
  };

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(await prepareBanner(file), "banners");
      set(imageKey, url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
    setBusy(false);
  };

  const title = item.id ? `Edit ${String(item.name)}` : isCol ? "New collection" : item.parent_id ? "New style" : "New category";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/40 md:items-center md:justify-center" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full space-y-4 overflow-y-auto rounded-t-[2rem] bg-ivory p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:max-w-lg md:rounded-[2rem]"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted">Cancel</button>
        </div>
        <div>
          <label className="label" htmlFor="n">Name</label>
          <input id="n" className="field" required value={String(item.name ?? "")} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="s">Web address</label>
          <input
            id="s"
            className="field text-sm"
            placeholder={slugify(String(item.name ?? "")) || "auto"}
            value={String(item.slug ?? "")}
            onChange={(e) => set("slug", slugify(e.target.value))}
          />
        </div>
        {isCol ? (
          <>
            <div>
              <label className="label" htmlFor="t">Tagline</label>
              <input id="t" className="field" value={String(item.tagline ?? "")} onChange={(e) => set("tagline", e.target.value)} placeholder="One short line" />
            </div>
            <div>
              <label className="label" htmlFor="st">Story</label>
              <textarea id="st" className="field min-h-24" value={String(item.story ?? "")} onChange={(e) => set("story", e.target.value)} placeholder="A few sentences shown on the collection page" />
            </div>
          </>
        ) : (
          <div>
            <label className="label" htmlFor="d">Description</label>
            <textarea id="d" className="field min-h-20" value={String(item.description ?? "")} onChange={(e) => set("description", e.target.value)} />
          </div>
        )}
        <div>
          <span className="label">{isCol ? "Banner photo" : "Tile photo"}</span>
          {item[imageKey] ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview */}
              <img src={String(item[imageKey])} alt="" className="max-h-48 w-full object-cover" />
              <button type="button" className="absolute right-2 top-2 bg-ink px-2 py-1 text-xs text-paper" onClick={() => set(imageKey, null)}>
                Remove
              </button>
            </div>
          ) : (
            <label className="btn btn-outline !min-h-11 w-full cursor-pointer">
              Choose photo
              <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="o">Order</label>
            <input id="o" className="field" inputMode="numeric" value={String(item.sort ?? 0)} onChange={(e) => set("sort", Number(e.target.value) || 0)} />
          </div>
          <label className="flex items-end gap-2 pb-3 text-sm">
            <input type="checkbox" className="size-5 accent-[var(--color-ink)]" checked={Boolean(item.visible)} onChange={(e) => set("visible", e.target.checked)} />
            Show in store
          </label>
        </div>
        {error && <p className="text-sm text-temple">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        {Boolean(item.id) && (
          <button type="button" className="w-full text-sm text-temple underline underline-offset-4" onClick={remove}>
            Delete
          </button>
        )}
      </form>
    </div>
  );
}
