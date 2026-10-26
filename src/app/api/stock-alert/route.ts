import { NextResponse } from "next/server";
import { withIndiaCode } from "@/lib/site";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/client";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** A shopper asks to be told on WhatsApp when a sold-out piece is back. */
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
  const phone = withIndiaCode(str(body.phone, 15));
  if (!productId || !/^[0-9]{10,12}$/.test(phone)) {
    return NextResponse.json({ error: "Please enter a valid WhatsApp number." }, { status: 400 });
  }
  if (!supabaseConfigured) return NextResponse.json({ ok: true });

  const { error } = await getServerSupabase().rpc("request_stock_alert", {
    p_product: productId,
    p_name: name,
    p_phone: phone,
  });
  if (error) return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
