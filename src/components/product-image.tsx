import type { Material, ProductImage as Img } from "@/lib/types";
import { ProductArt } from "./product-art";

/** A product photo at 4:5, or the line illustration when no photo exists yet. */
export function ProductImage({
  image,
  alt,
  kind,
  material,
  priority = false,
  thumb = false,
  className = "",
}: {
  image?: Img;
  alt: string;
  kind: string;
  material: Material;
  priority?: boolean;
  thumb?: boolean;
  className?: string;
}) {
  const src = image ? (thumb ? (image.thumb ?? image.url) : image.url) : null;
  return (
    <div className={`relative aspect-[4/5] overflow-hidden bg-sand ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- photos are pre-compressed WebP from Supabase Storage
        <img
          src={src}
          alt={image?.alt || alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <ProductArt kind={kind} material={material} className="absolute inset-0 size-full" />
      )}
    </div>
  );
}
