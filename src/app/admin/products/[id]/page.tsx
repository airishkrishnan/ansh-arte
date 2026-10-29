"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminHeader } from "@/components/admin/shell";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    getBrowserSupabase()
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setProduct((data as Product) ?? null));
  }, [id]);

  if (product === undefined) return <AdminHeader title="Edit product" back="/admin/products" />;
  if (product === null) {
    return (
      <>
        <AdminHeader title="Not found" back="/admin/products" />
        <p className="p-8 text-center text-sm text-muted">This product no longer exists.</p>
      </>
    );
  }
  return <ProductForm key={product.id} initial={product} />;
}
