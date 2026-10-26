import { toBlob, toCanvas } from "./admin/image";
import { getBrowserSupabase } from "./supabase/client";

/** Shrinks a customer's review photo in the browser and uploads it to the public "reviews" bucket. */
export async function uploadReviewPhoto(file: File) {
  const blob = await toBlob(await toCanvas(file, 1200, 1500, false), 0.8);
  const sb = getBrowserSupabase();
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.webp`;
  const { error } = await sb.storage.from("reviews").upload(path, blob, { contentType: "image/webp" });
  if (error) throw error;
  return sb.storage.from("reviews").getPublicUrl(path).data.publicUrl;
}
