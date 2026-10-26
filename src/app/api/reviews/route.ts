import { NextResponse } from "next/server";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/client";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** A shopper submits a review; it waits for approval in Admin -> Inbox. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (str(body.website, 100)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const productId = str(body.product_id, 64);
  const name = str(body.name, 60);
  const city = str(body.city, 40);
  const text = str(body.body, 1000);
  const rating = Math.round(Number(body.rating));
  const photos = Array.isArray(body.photos)
    ? body.photos.slice(0, 3).map((p) => str(p, 400)).filter((p) => p.includes("/storage/v1/object/public/reviews/"))
    : [];

  if (!productId || !name || !text || !(rating >= 1 && rating <= 5)) {
    return NextResponse.json({ error: "Please add a star rating, your name and a few words." }, { status: 400 });
  }
  if (!supabaseConfigured) return NextResponse.json({ ok: true });

  const { error } = await getServerSupabase().rpc("submit_review", {
    p_product: productId,
    p_name: name,
    p_city: city,
    p_rating: rating,
    p_body: text,
    p_photos: photos,
  });
  if (error) return NextResponse.json({ error: "Could not send your review. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
