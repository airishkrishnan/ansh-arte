"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category, Collection } from "@/lib/types";

/** Loads every category and collection, hidden ones included (admin only). */
export function useCatalogue() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const sb = getBrowserSupabase();
    const [c, k] = await Promise.all([
      sb.from("categories").select("*").order("sort").order("name"),
      sb.from("collections").select("*").order("sort").order("name"),
    ]);
    setCategories((c.data as Category[]) ?? []);
    setCollections((k.data as Collection[]) ?? []);
    setReady(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    reload();
  }, [reload]);

  /** "Earrings › Jhumkas" style label for a category id. */
  const label = useCallback(
    (id: string) => {
      const c = categories.find((x) => x.id === id);
      if (!c) return "";
      const p = c.parent_id ? categories.find((x) => x.id === c.parent_id) : null;
      return p ? `${p.name} › ${c.name}` : c.name;
    },
    [categories],
  );

  /** Categories a product can belong to: styles, plus top categories that have no styles. */
  const leaves = categories
    .filter((c) => c.parent_id || !categories.some((x) => x.parent_id === c.id))
    .sort((a, b) => label(a.id).localeCompare(label(b.id)));

  return { categories, collections, ready, reload, label, leaves };
}
