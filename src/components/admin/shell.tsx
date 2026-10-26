"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { getBrowserSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { Logo, Monogram } from "../header";

type AdminCtx = { session: Session; signOut: () => Promise<void> };
const Ctx = createContext<AdminCtx | null>(null);
export const useAdmin = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin outside AdminShell");
  return c;
};

const TABS = [
  { href: "/admin/orders", label: "Orders", icon: "M5 4h14v16H5zM9 8h6M9 12h6M9 16h4" },
  { href: "/admin/products", label: "Products", icon: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" },
  { href: "/admin/inbox", label: "Inbox", icon: "M4 13l2.5-8h11L20 13v6H4zM4 13h5l1 2h4l1-2h5" },
  { href: "/admin/catalogue", label: "Catalogue", icon: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z" },
  { href: "/admin/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .2-1.3-1.3.2-2-3-1-1 2h-1.8l-1-2-3 1 .2 2L6.9 7.2 5 7 4 10l2 1v1.8l-2 1 1 3 2-.2 1.3 1.3-.2 2 3 1 1-2h1.8l1 2 3-1-.2-2 1.3-1.3 2 .2 1-3-2-1z" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<"loading" | "signed-out" | "not-admin" | "ok">("loading");
  const pathname = usePathname();

  useEffect(() => {
    if (!supabaseConfigured) return;
    const sb = getBrowserSupabase();
    const check = async (s: Session | null) => {
      setSession(s);
      if (!s) return setState("signed-out");
      const { data } = await sb.from("admins").select("email").limit(1);
      setState(data && data.length ? "ok" : "not-admin");
    };
    sb.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      check(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured) {
    return (
      <Centered>
        <h1 className="heading-md">Connect Supabase first</h1>
        <p className="mt-3 text-sm text-ink-soft">
          The admin needs the Supabase keys. Follow the steps in <code>SETUP.md</code>, then reload this page.
        </p>
      </Centered>
    );
  }
  if (state === "loading") return <Centered><p className="text-sm text-muted">Loading…</p></Centered>;
  if (state === "signed-out") return <Login />;
  if (state === "not-admin" || !session) {
    return (
      <Centered>
        <h1 className="heading-md">Not an admin account</h1>
        <p className="mt-3 text-sm text-ink-soft">
          {session?.user.email} is signed in but is not listed as an admin. Add this email to the admins table in
          Supabase (see SETUP.md).
        </p>
        <button className="btn btn-outline mt-6" onClick={() => getBrowserSupabase().auth.signOut()}>
          Sign out
        </button>
      </Centered>
    );
  }

  const signOut = async () => {
    await getBrowserSupabase().auth.signOut();
  };

  return (
    <Ctx.Provider value={{ session, signOut }}>
      <div className="min-h-dvh bg-ivory pb-24 md:pb-0 md:pl-56">
        <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col bg-ink p-5 text-brass-soft md:flex">
          <Link href="/admin/orders" className="flex items-center gap-3">
            <Monogram className="h-10 w-8 shrink-0" arch="var(--color-silver)" letter="var(--color-brass-soft)" />
            <span>
              <Logo className="block text-lg" accent="text-silver" />
              <span className="mt-1.5 block text-[0.6rem] uppercase tracking-[0.3em] text-silver">Admin studio</span>
            </span>
          </Link>
          <nav className="mt-10 space-y-1">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors ${
                  pathname.startsWith(t.href)
                    ? "border-silver bg-brass-soft/10 text-paper"
                    : "border-transparent text-brass-soft/70 hover:bg-brass-soft/5 hover:text-paper"
                }`}
              >
                <TabIcon d={t.icon} />
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-2 border-t border-brass-soft/15 pt-4 text-xs text-brass-soft/60">
            <Link href="/" target="_blank" className="block hover:text-paper">
              View store ↗
            </Link>
            <button onClick={signOut} className="hover:text-paper">
              Sign out
            </button>
          </div>
        </aside>
        {children}
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 bg-ink pb-[env(safe-area-inset-bottom)] md:hidden">
          {TABS.map((t) => {
            const on = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-semibold ${on ? "text-paper" : "text-brass-soft/55"}`}
              >
                {on && <span className="absolute inset-x-5 top-0 h-0.5 bg-silver" />}
                <TabIcon d={t.icon} />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </Ctx.Provider>
  );
}

function TabIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-ivory md:grid-cols-[1.1fr_1fr]">
      <div className="relative isolate flex min-h-[38svh] flex-col justify-end overflow-hidden bg-ink p-6 text-brass-soft md:min-h-dvh md:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative banner */}
        <img
          src="/samples/banner-silver.webp"
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover object-[70%_center] opacity-70"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/10 md:bg-gradient-to-r md:from-ink/90 md:via-ink/50" />
        <Monogram className="mb-5 h-14 w-11 md:h-20 md:w-16" arch="var(--color-silver)" letter="var(--color-brass-soft)" />
        <Logo className="block text-2xl md:text-3xl" accent="text-silver" />
        <p className="mt-3 text-[0.65rem] uppercase tracking-[0.3em] text-silver">Admin studio</p>
      </div>
      <div className="grid place-items-center px-6 py-10">
        <div className="w-full max-w-sm text-center">{children}</div>
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Centered>
      <form
        className="space-y-4 text-left"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const { error } = await getBrowserSupabase().auth.signInWithPassword({ email, password });
          if (error) setError(error.message);
          setBusy(false);
        }}
      >
        <div className="mb-6 text-center">
          <p className="eyebrow mb-3">Welcome back</p>
          <h1 className="heading-md">Sign in to your studio</h1>
        </div>
        <div>
          <label className="label" htmlFor="em">Email</label>
          <input id="em" type="email" autoComplete="email" className="field" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <input id="pw" type="password" autoComplete="current-password" className="field" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-temple">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Centered>
  );
}

/** Page header used by every admin screen. */
export function AdminHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-ivory/95 px-4 backdrop-blur md:h-16 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/admin/orders" className="md:hidden" aria-label="Admin home">
          <Monogram className="h-8 w-6" arch="var(--color-brass)" letter="var(--color-ink)" />
        </Link>
        <h1 className="truncate font-serif text-2xl">{title}</h1>
      </div>
      {action}
    </header>
  );
}
