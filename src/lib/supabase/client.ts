import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True once Supabase keys are set. Without them the store runs on demo data. */
export const supabaseConfigured = Boolean(url && key);

let browserClient: SupabaseClient | null = null;

/** Client for the browser (admin app). Keeps the admin signed in on this device. */
export function getBrowserSupabase() {
  if (!supabaseConfigured) throw new Error("Supabase is not configured");
  browserClient ??= createClient(url!, key!, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "ansh-arte-admin" },
  });
  return browserClient;
}

/** Stateless client for server-side reads with the public key. */
export function getServerSupabase() {
  if (!supabaseConfigured) throw new Error("Supabase is not configured");
  return createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
