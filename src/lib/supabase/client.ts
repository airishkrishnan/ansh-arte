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

let customerClient: SupabaseClient | null = null;

/**
 * Client for customer accounts in the store. Kept apart from the admin client
 * so a customer sign-in never touches the admin's session on the same phone.
 */
export function getCustomerSupabase() {
  if (!supabaseConfigured) throw new Error("Supabase is not configured");
  customerClient ??= createClient(url!, key!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "ansh-arte-account",
    },
  });
  return customerClient;
}

/** Stateless client for server-side reads with the public key. */
export function getServerSupabase(accessToken?: string) {
  if (!supabaseConfigured) throw new Error("Supabase is not configured");
  return createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Acts as the signed-in customer when their token is passed
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}
