import { NextResponse } from "next/server";
import { findOrderKey } from "@/lib/orders";

export async function POST(req: Request) {
  const { number, phone } = (await req.json().catch(() => ({}))) as { number?: string; phone?: string };
  if (!number || !phone) return NextResponse.json({ error: "Enter your order number and phone" }, { status: 400 });
  const key = await findOrderKey(String(number).slice(0, 20), String(phone).slice(0, 15));
  if (!key) {
    return NextResponse.json(
      { error: "We couldn't find that order. Check the number and the phone used at checkout." },
      { status: 404 },
    );
  }
  return NextResponse.json({ url: `/order/${String(number).trim().toUpperCase()}?k=${key}` });
}
