"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCustomerSupabase, supabaseConfigured } from "@/lib/supabase/client";

export type Profile = { name: string; phone: string };

type AccountState = {
  /** False until Supabase is connected; accounts are switched off on demo data. */
  enabled: boolean;
  ready: boolean;
  user: User | null;
  profile: Profile;
  saveProfile: (p: Profile) => Promise<string | null>;
  signOut: () => Promise<void>;
  /** Fresh access token for the signed-in customer, if any. */
  token: () => Promise<string | undefined>;
  wishlist: string[];
  inWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
};

const AccountContext = createContext<AccountState | null>(null);
const WISH_KEY = "ansh-arte-wishlist-v1";

const readLocal = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(WISH_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 100) : [];
  } catch {
    return [];
  }
};
const writeLocal = (ids: string[]) => {
  try {
    if (ids.length) localStorage.setItem(WISH_KEY, JSON.stringify(ids));
    else localStorage.removeItem(WISH_KEY);
  } catch {}
};

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile>({ name: "", phone: "" });
  const [wishlist, setWishlist] = useState<string[]>([]);
  const userId = user?.id;

  // Follow the sign-in state. Supabase calls must not be awaited inside the
  // auth callback, so the loading happens in the effect below.
  useEffect(() => {
    if (!supabaseConfigured) return;
    const sb = getCustomerSupabase();
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load the profile and wishlist for whoever is signed in (or this device)
  useEffect(() => {
    if (!authReady) return;
    let live = true;
    (async () => {
      if (!userId) {
        setProfile({ name: "", phone: "" });
        setWishlist(readLocal());
        setLoaded(true);
        return;
      }
      const sb = getCustomerSupabase();
      // Pieces saved before signing in move into the account
      const local = readLocal();
      if (local.length) {
        const { error } = await sb
          .from("wishlist")
          .upsert(local.map((product_id) => ({ product_id })), { onConflict: "user_id,product_id", ignoreDuplicates: true });
        if (!error) writeLocal([]);
      }
      const [{ data: p }, { data: w }] = await Promise.all([
        sb.from("profiles").select("name, phone").eq("id", userId).maybeSingle(),
        sb.from("wishlist").select("product_id").order("created_at", { ascending: false }),
      ]);
      if (!live) return;
      const meta = user?.user_metadata ?? {};
      setProfile({
        name: p?.name || meta.full_name || meta.name || "",
        phone: p?.phone || "",
      });
      setWishlist((w ?? []).map((r) => r.product_id as string));
      setLoaded(true);
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the signed-in person changes
  }, [authReady, userId]);

  const saveProfile = useCallback(
    async (p: Profile) => {
      if (!userId) return "Please sign in again";
      const clean = { name: p.name.trim().slice(0, 80), phone: p.phone.replace(/[^0-9+ ]/g, "").slice(0, 15) };
      const { error } = await getCustomerSupabase().from("profiles").upsert({ id: userId, ...clean });
      if (error) return error.message;
      setProfile(clean);
      return null;
    },
    [userId],
  );

  const signOut = useCallback(async () => {
    await getCustomerSupabase().auth.signOut();
  }, []);

  const token = useCallback(async () => {
    if (!supabaseConfigured || !userId) return undefined;
    const { data } = await getCustomerSupabase().auth.getSession();
    return data.session?.access_token;
  }, [userId]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const prev = wishlist;
      const has = prev.includes(productId);
      const next = has ? prev.filter((id) => id !== productId) : [productId, ...prev].slice(0, 100);
      setWishlist(next);
      if (!userId) return writeLocal(next);
      const t = getCustomerSupabase().from("wishlist");
      (has ? t.delete().eq("product_id", productId) : t.insert({ product_id: productId })).then(({ error }) => {
        // Put it back the way it was if the save failed
        if (error && !/duplicate/i.test(error.message)) setWishlist(prev);
      });
    },
    [wishlist, userId],
  );

  const value = useMemo<AccountState>(
    () => ({
      enabled: supabaseConfigured,
      ready: authReady && loaded,
      user,
      profile,
      saveProfile,
      signOut,
      token,
      wishlist,
      inWishlist: (id) => wishlist.includes(id),
      toggleWishlist,
    }),
    [authReady, loaded, user, profile, saveProfile, signOut, token, wishlist, toggleWishlist],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside AccountProvider");
  return ctx;
}

/** Display name for greetings: profile name, else the part of the email before @. */
export const firstName = (profile: Profile, user: User | null) =>
  (profile.name || user?.email?.split("@")[0] || "").split(" ")[0];
