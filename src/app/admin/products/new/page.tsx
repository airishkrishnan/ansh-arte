"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/product-form";
import type { Product } from "@/lib/types";

export default function NewProductPage() {
  const [initial, setInitial] = useState<Product | undefined>();

  // "Duplicate" on an existing product pre-fills this form
  useEffect(() => {
    if (!location.search.includes("dup=1")) return;
    try {
      const raw = sessionStorage.getItem("ansh-arte-duplicate");
      sessionStorage.removeItem("ansh-arte-duplicate");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the duplicated product once
      if (raw) setInitial(JSON.parse(raw) as Product);
    } catch {}
  }, []);

  return <ProductForm key={initial ? "dup" : "new"} initial={initial} />;
}
