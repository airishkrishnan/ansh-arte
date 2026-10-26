import { getBrowserSupabase } from "@/lib/supabase/client";

// Shrinks a phone photo in the browser before upload: crops to 4:5 portrait
// and saves a large WebP plus a small thumbnail. Keeps storage and page
// weight tiny, so the Supabase free tier lasts.

export async function toCanvas(file: File, width: number, height: number, crop: boolean) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  let sx = 0,
    sy = 0,
    sw = bitmap.width,
    sh = bitmap.height;
  if (crop) {
    const target = width / height;
    const ratio = bitmap.width / bitmap.height;
    if (ratio > target) {
      sw = bitmap.height * target;
      sx = (bitmap.width - sw) / 2;
    } else {
      sh = bitmap.width / target;
      sy = (bitmap.height - sh) / 2;
    }
  }
  const scale = Math.min(1, width / sw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

export const toBlob = (c: HTMLCanvasElement, q: number) =>
  new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process photo"))), "image/webp", q),
  );

/** Product photo: 4:5, 1600px wide max, plus a 600px thumbnail. */
export async function prepareProductPhoto(file: File) {
  const [large, small] = await Promise.all([
    toCanvas(file, 1600, 2000, true).then((c) => toBlob(c, 0.82)),
    toCanvas(file, 600, 750, true).then((c) => toBlob(c, 0.78)),
  ]);
  return { large, small };
}

/** Banner photo: keeps the original shape, 2000px wide max. */
export async function prepareBanner(file: File) {
  const c = await toCanvas(file, 2000, 2000, false);
  return toBlob(c, 0.8);
}


/** Uploads a processed image to the public "products" bucket and returns its URL. */
export async function uploadImage(blob: Blob, folder: string) {
  const sb = getBrowserSupabase();
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await sb.storage.from("products").upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (error) throw error;
  return sb.storage.from("products").getPublicUrl(path).data.publicUrl;
}
