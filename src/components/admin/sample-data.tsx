"use client";

import { useEffect, useState } from "react";
import { SAMPLE_COUNTS, addSampleData, hasSampleData, removeSampleData } from "@/lib/admin/sample-data";
import { Card, Icon } from "./ui";

/**
 * Add or remove sample products and orders. With `onlyWhenEmpty`, the invite is
 * shown only while the store has fewer than 5 products (the remove banner always shows).
 */
export function SampleData({ productCount, onlyWhenEmpty = false }: { productCount?: number; onlyWhenEmpty?: boolean }) {
  const [has, setHas] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"" | "add" | "remove">("");
  const [error, setError] = useState("");

  useEffect(() => {
    hasSampleData().then(setHas, () => setHas(false));
  }, []);

  const run = async (kind: "add" | "remove") => {
    if (kind === "remove" && !confirm("Remove all sample products and sample orders? Your own products and orders stay.")) return;
    setBusy(kind);
    setError("");
    try {
      await (kind === "add" ? addSampleData() : removeSampleData());
      location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy("");
    }
  };

  if (has === null) return null;

  if (has) {
    return (
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[#d9c27a]/60 bg-[#f6ebc4] p-4 text-[#5e430c] sm:flex-row sm:items-center">
        <Icon name="sparkle" className="size-5 shrink-0" />
        <p className="flex-1 text-[0.95rem] leading-relaxed">
          <strong>Sample data is on.</strong> The sample pieces show in your store too. Remove them once you add your own.
        </p>
        <button
          type="button"
          onClick={() => run("remove")}
          disabled={!!busy}
          className="h-11 shrink-0 rounded-full border border-[#5e430c]/25 bg-paper/70 px-5 text-sm font-semibold hover:bg-paper disabled:opacity-50"
        >
          {busy === "remove" ? "Removing…" : "Remove sample data"}
        </button>
        {error && <p className="text-sm text-temple sm:basis-full">{error}</p>}
      </div>
    );
  }

  if (onlyWhenEmpty && (productCount ?? 0) >= 5) return null;

  return (
    <Card className="p-5 md:p-6">
      <p className="flex items-center gap-2 text-lg font-semibold">
        <Icon name="sparkle" className="size-5 text-brass-deep" /> See it with sample data
      </p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
        Fill the store and admin with {SAMPLE_COUNTS.products} sample pieces (with photos) and {SAMPLE_COUNTS.orders} sample orders, so you can see how everything
        looks. Remove them in one tap when your own products are ready.
      </p>
      <button
        type="button"
        onClick={() => run("add")}
        disabled={!!busy}
        className="mt-4 h-12 rounded-full bg-ink px-6 font-semibold text-paper hover:bg-ink-soft disabled:opacity-50"
      >
        {busy === "add" ? "Adding sample data…" : "Add sample data"}
      </button>
      {error && <p className="mt-3 text-sm text-temple">{error}</p>}
    </Card>
  );
}
