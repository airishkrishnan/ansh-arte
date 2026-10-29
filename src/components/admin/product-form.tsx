"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { prepareProductPhoto, uploadImage } from "@/lib/admin/image";
import { slugify } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { MATERIALS, type Material, type Product, type ProductImage } from "@/lib/types";
import { AdminHeader } from "./shell";
import { useCatalogue } from "./use-catalogue";

type Draft = Omit<Product, "id" | "created_at"> & { id?: string };

const EMPTY: Draft = {
  name: "",
  slug: "",
  category_id: "",
  collection_id: null,
  material: "oxidised-brass",
  price: 0,
  compare_at_price: null,
  stock: 1,
  description: "",
  details: "Length: \nWeight: \nClosure: ",
  care: "",
  images: [],
  visible: true,
  featured: false,
  sort: 0,
};

export function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const { leaves, label, collections, ready } = useCatalogue();
  const [p, setP] = useState<Draft>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [uploading, setUploading] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setSaved(false);
    setP((d) => ({ ...d, [k]: v }));
  };

  const categoryCollections = collections.filter((c) => c.category_id === p.category_id);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const list = Array.from(files).slice(0, 8 - p.images.length);
    setUploading((n) => n + list.length);
    const folder = slugify(p.name) || "product";
    await Promise.all(
      list.map(async (file) => {
        try {
          const { large, small } = await prepareProductPhoto(file);
          const [url, thumb] = await Promise.all([uploadImage(large, folder), uploadImage(small, folder)]);
          setSaved(false);
          setP((d) => ({ ...d, images: [...d.images, { url, thumb, alt: "" }] }));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Photo upload failed");
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= p.images.length) return;
    const imgs = [...p.images];
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    set("images", imgs);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!p.category_id) return setError("Choose a category");
    if (p.price <= 0) return setError("Enter a price");
    setBusy(true);
    const sb = getBrowserSupabase();
    const row = {
      ...p,
      slug: p.slug || slugify(p.name),
      images: p.images.map((img) => ({ ...img, alt: img.alt || p.name })),
      compare_at_price: p.compare_at_price || null,
    };
    delete (row as Partial<Draft>).id;
    let res = p.id
      ? await sb.from("products").update(row).eq("id", p.id).select("*").single()
      : await sb.from("products").insert(row).select("*").single();
    if (res.error?.code === "23505") {
      // Web address already used by another product: add a short suffix
      row.slug = `${row.slug}-${Math.random().toString(36).slice(2, 6)}`;
      res = p.id
        ? await sb.from("products").update(row).eq("id", p.id).select("*").single()
        : await sb.from("products").insert(row).select("*").single();
    }
    setBusy(false);
    if (res.error) return setError(res.error.message);
    const savedRow = res.data as Product;
    setP(savedRow);
    setSaved(true);
    if (!p.id) router.replace(`/admin/products/${savedRow.id}?created=1`);
  };

  const duplicate = () => {
    if (!p.id) return;
    sessionStorage.setItem(
      "ansh-arte-duplicate",
      JSON.stringify({ ...p, id: undefined, name: `${p.name} (copy)`, slug: "", images: [] }),
    );
    router.push("/admin/products/new?dup=1");
  };

  const remove = async () => {
    if (!p.id || !confirm(`Delete "${p.name}"? This cannot be undone. (Tip: hide it instead to keep it.)`)) return;
    const { error } = await getBrowserSupabase().from("products").delete().eq("id", p.id);
    if (error) return setError(error.message);
    router.replace("/admin/products");
  };

  return (
    <>
      <AdminHeader title={p.id ? "Edit product" : "New product"} back="/admin/products" />
      <form onSubmit={save} className="mx-auto max-w-3xl space-y-6 px-4 pb-32 pt-2 md:px-8 md:pt-4">
        {/* Photos */}
        <section className="space-y-3 rounded-[1.75rem] border border-line bg-paper p-4 md:p-6">
          <p className="label">Photos ({p.images.length}/8) · first photo is the cover</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {p.images.map((img: ProductImage, i) => (
              <div key={img.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- upload preview */}
                <img src={img.thumb ?? img.url} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-paper">
                    Cover
                  </span>
                )}
                <div className="absolute inset-x-1 bottom-1 flex justify-between rounded-full bg-ink/65 text-paper backdrop-blur">
                  <button type="button" className="px-2 py-1 text-sm disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move left">←</button>
                  <button
                    type="button"
                    className="px-2 py-1 text-xs"
                    onClick={() => set("images", p.images.filter((_, j) => j !== i))}
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                  <button type="button" className="px-2 py-1 text-sm disabled:opacity-30" disabled={i === p.images.length - 1} onClick={() => move(i, 1)} aria-label="Move right">→</button>
                </div>
              </div>
            ))}
            {Array.from({ length: uploading }).map((_, i) => (
              <div key={`u${i}`} className="grid aspect-[4/5] animate-pulse place-items-center rounded-2xl bg-sand text-xs text-muted">
                Uploading…
              </div>
            ))}
          </div>
          {p.images.length < 8 && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-outline !min-h-11" onClick={() => cameraRef.current?.click()}>
                Take photo
              </button>
              <button type="button" className="btn btn-outline !min-h-11" onClick={() => fileRef.current?.click()}>
                From gallery
              </button>
            </div>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          <p className="text-xs text-muted">Photos are cropped to portrait 4:5 and compressed automatically. Use a plain background and daylight.</p>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-line bg-paper p-4 md:p-6">
          <div>
            <label className="label" htmlFor="name">Product name</label>
            <input
              id="name"
              className="field"
              required
              placeholder="e.g. Maharani Peacock Jhumka"
              value={p.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="slug">Web address</label>
            <div className="flex items-center gap-1 text-sm text-muted">
              <span>/product/</span>
              <input
                id="slug"
                className="field !min-h-10 flex-1 text-sm"
                value={p.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 rounded-[1.75rem] border border-line bg-paper p-4 md:p-6">
          <div className="col-span-2">
            <label className="label" htmlFor="cat">Category</label>
            <select
              id="cat"
              className="field"
              required
              value={p.category_id}
              onChange={(e) => {
                set("category_id", e.target.value);
                set("collection_id", null);
              }}
            >
              <option value="">{ready ? "Choose…" : "Loading…"}</option>
              {leaves.map((c) => (
                <option key={c.id} value={c.id}>{label(c.id)}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="col">Collection</label>
            <select
              id="col"
              className="field"
              value={p.collection_id ?? ""}
              onChange={(e) => set("collection_id", e.target.value || null)}
              disabled={!p.category_id}
            >
              <option value="">No collection</option>
              {categoryCollections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <span className="label">Material</span>
            <div className="grid grid-cols-2 gap-2">
              {MATERIALS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => set("material", m.value as Material)}
                  className={`min-h-11 border text-sm ${p.material === m.value ? "border-ink bg-ink text-paper" : "border-line bg-paper"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="price">Price (₹)</label>
            <input id="price" className="field" inputMode="numeric" required value={p.price || ""} onChange={(e) => set("price", Number(e.target.value.replace(/\D/g, "")) || 0)} />
          </div>
          <div>
            <label className="label" htmlFor="mrp">Was price (₹)</label>
            <input
              id="mrp"
              className="field"
              inputMode="numeric"
              placeholder="Optional"
              value={p.compare_at_price ?? ""}
              onChange={(e) => set("compare_at_price", Number(e.target.value.replace(/\D/g, "")) || null)}
            />
          </div>
          <div>
            <label className="label" htmlFor="stock">Stock</label>
            <input id="stock" className="field" inputMode="numeric" value={p.stock} onChange={(e) => set("stock", Number(e.target.value.replace(/\D/g, "")) || 0)} />
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-5 accent-[var(--color-ink)]" checked={p.visible} onChange={(e) => set("visible", e.target.checked)} />
              Show in store
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-5 accent-[var(--color-ink)]" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} />
              Feature on home
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-line bg-paper p-4 md:p-6">
          <div>
            <label className="label" htmlFor="desc">Description</label>
            <textarea id="desc" className="field min-h-28" value={p.description} onChange={(e) => set("description", e.target.value)} placeholder="What makes this piece special, how to style it…" />
          </div>
          <div>
            <label className="label" htmlFor="details">Details (one per line, “Label: value”)</label>
            <textarea id="details" className="field min-h-24 font-mono text-sm" value={p.details} onChange={(e) => set("details", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="care">Care notes (optional)</label>
            <textarea id="care" className="field min-h-20" value={p.care} onChange={(e) => set("care", e.target.value)} placeholder="Leave empty to use the standard care text" />
          </div>
        </section>

        {error && <p className="rounded-2xl border border-temple/30 bg-temple/5 p-3 text-sm text-temple">{error}</p>}

        {p.id && (
          <div className="flex flex-wrap gap-4 text-sm">
            <a href={`/product/${p.slug}`} target="_blank" className="underline underline-offset-4">View in store ↗</a>
            <button type="button" onClick={duplicate} className="underline underline-offset-4">Duplicate</button>
            <button type="button" onClick={remove} className="text-temple underline underline-offset-4">Delete</button>
          </div>
        )}

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/90 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur-xl md:left-64">
          <div className="mx-auto max-w-3xl">
            <button className="btn btn-primary w-full" disabled={busy || uploading > 0}>
              {uploading > 0 ? "Uploading photos…" : busy ? "Saving…" : saved ? "Saved ✓" : p.id ? "Save changes" : "Add product"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
