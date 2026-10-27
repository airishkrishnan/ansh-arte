import { NextResponse } from "next/server";
import { EMAIL_STATUSES, emailConfigured, sendOrderEmail } from "@/lib/email";
import { DEFAULT_SETTINGS } from "@/lib/site";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

/**
 * Emails the customer about their order's current status. Called by the admin
 * after changing an order; the admin's sign-in token is passed along, so only
 * admins can read the order (database security rules).
 */
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer (\S{20,4096})$/)?.[1];
  if (!token || !supabaseConfigured) return NextResponse.json({ sent: false }, { status: 401 });

  let id = "";
  try {
    id = String((await req.json()).id ?? "").slice(0, 64);
  } catch {}
  if (!id) return NextResponse.json({ sent: false }, { status: 400 });

  const sb = getServerSupabase(token);
  const [{ data }, { data: s }] = await Promise.all([
    sb.from("orders").select("*").eq("id", id).maybeSingle(),
    sb.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  const order = data as Order | null;
  if (!order) return NextResponse.json({ sent: false }, { status: 404 });
  if (!order.email || !EMAIL_STATUSES.includes(order.status) || !emailConfigured()) {
    return NextResponse.json({ sent: false });
  }

  const sent = await sendOrderEmail({ ...order, key: order.access_key }, order.status, { ...DEFAULT_SETTINGS, ...s });
  return NextResponse.json({ sent, to: sent ? order.email : undefined });
}
