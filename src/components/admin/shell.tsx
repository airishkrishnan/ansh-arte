"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { getBrowserSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { Logo, Monogram } from "../header";
import { AdminSearch } from "./search";
import { Icon, RoundButton, type IconName } from "./ui";

type AdminCtx = { session: Session; signOut: () => Promise<void>; openSearch: () => void };
const Ctx = createContext<AdminCtx | null>(null);
export const useAdmin = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin outside AdminShell");
  return c;
};

type NavEntry = { href: string; label: string; icon: IconName; children?: { href: string; label: string }[] };

const NAV: NavEntry[] = [
  { href: "/admin", label: "Home", icon: "home" },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: "orders",
    children: [
      { href: "/admin/orders?tab=new", label: "To confirm" },
      { href: "/admin/orders?tab=confirmed", label: "Awaiting payment" },
      { href: "/admin/orders?tab=paid", label: "To pack and ship" },
      { href: "/admin/orders?tab=all", label: "All orders" },
    ],
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: "products",
    children: [
      { href: "/admin/products/new", label: "Add product" },
      { href: "/admin/catalogue", label: "Categories and collections" },
    ],
  },
  { href: "/admin/customers", label: "Customers", icon: "customers" },
  { href: "/admin/inbox", label: "Reviews and alerts", icon: "inbox" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

const isOn = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
const groupOn = (pathname: string, e: NavEntry) =>
  isOn(pathname, e.href) || !!e.children?.some((c) => !c.href.includes("?") && pathname.startsWith(c.href));

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<"loading" | "signed-out" | "not-admin" | "ok">("loading");
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
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

  // Close the menu and search whenever the page changes
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenu(false);
    setSearch(false);
  }

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
  // The product editor has its own save bar along the bottom
  const editing = /^\/admin\/products\/[^/]+$/.test(pathname);

  return (
    <Ctx.Provider value={{ session, signOut, openSearch: () => setSearch(true) }}>
      <div className={`admin-ui min-h-dvh bg-ivory md:pb-0 md:pl-64 print:bg-white print:p-0 ${editing ? "" : "pb-28"}`}>
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto bg-ink px-3 py-5 text-paper md:flex print:hidden">
          <Link href="/admin" className="mb-6 flex items-center gap-3 px-3">
            <Monogram className="h-10 w-8 shrink-0" arch="var(--color-silver)" letter="var(--color-brass-soft)" />
            <span>
              <Logo className="block text-lg" accent="text-silver" />
              <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.3em] text-silver">Admin studio</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSearch(true)}
            className="mx-1 mb-4 flex items-center gap-3 rounded-full bg-paper/10 px-4 py-2.5 text-sm text-paper/60 hover:bg-paper/15"
          >
            <Icon name="search" className="size-4" /> Search
          </button>
          <NavTree pathname={pathname} />
          <div className="mt-auto space-y-0.5 border-t border-paper/10 pt-3 text-sm">
            <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-paper/70 hover:bg-paper/5 hover:text-paper">
              <Icon name="store" className="size-[1.1rem]" /> View store
            </Link>
            <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-paper/70 hover:bg-paper/5 hover:text-paper">
              <Icon name="logout" className="size-[1.1rem]" /> Sign out
            </button>
          </div>
        </aside>

        {children}

        {!editing && !menu && <BottomBar pathname={pathname} onSearch={() => setSearch(true)} onMenu={() => setMenu(true)} />}
        {menu && <MobileMenu pathname={pathname} email={session.user.email ?? ""} onClose={() => setMenu(false)} signOut={signOut} />}
        {search && <AdminSearch onClose={() => setSearch(false)} />}
      </div>
    </Ctx.Provider>
  );
}

/** Shopify-style floating bar on phones: search, the four main tabs, and the store. */
function BottomBar({ pathname, onSearch, onMenu }: { pathname: string; onSearch: () => void; onMenu: () => void }) {
  const tabs = NAV.slice(0, 3);
  const glass = "border border-line/70 bg-paper/85 shadow-[0_8px_30px_rgba(33,27,26,0.14)] backdrop-blur-xl";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 px-3 pb-[max(env(safe-area-inset-bottom),0.9rem)] md:hidden print:hidden" aria-label="Admin">
      <button type="button" onClick={onSearch} className={`grid size-14 shrink-0 place-items-center rounded-full text-ink ${glass}`} aria-label="Search">
        <Icon name="search" className="size-6" />
      </button>
      <div className={`flex items-center gap-0.5 rounded-full p-1 ${glass}`}>
        {tabs.map((t) => {
          const on = groupOn(pathname, t);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-label={t.label}
              aria-current={on ? "page" : undefined}
              className={`grid h-12 w-[3.6rem] place-items-center rounded-full transition-colors ${on ? "bg-ink text-paper" : "text-ink-soft"}`}
            >
              <Icon name={t.icon} className="size-6" />
            </Link>
          );
        })}
        <button type="button" onClick={onMenu} className="grid h-12 w-[3.6rem] place-items-center rounded-full text-ink-soft" aria-label="Menu">
          <Icon name="menu" className="size-6" />
        </button>
      </div>
      <Link href="/" target="_blank" className={`grid size-14 shrink-0 place-items-center rounded-full ${glass}`} aria-label="View store">
        <Monogram className="h-8 w-6" arch="var(--color-brass)" letter="var(--color-ink)" />
      </Link>
    </nav>
  );
}

/** The full navigation list, with expandable groups. Used by the sidebar and the phone menu. */
function NavTree({ pathname, large = false }: { pathname: string; large?: boolean }) {
  const [open, setOpen] = useState<string | null>(() => NAV.find((e) => e.children && groupOn(pathname, e))?.href ?? null);
  const row = large ? "gap-4 px-4 py-3.5 text-[1.15rem]" : "gap-3 px-3 py-2.5 text-[0.92rem]";
  return (
    <ul className="space-y-0.5">
      {NAV.map((e) => {
        const on = groupOn(pathname, e);
        const expanded = open === e.href;
        return (
          <li key={e.href}>
            <div className={`flex items-center rounded-2xl ${on ? "bg-paper/10" : ""}`}>
              <Link href={e.href} className={`flex flex-1 items-center ${row} ${on ? "font-semibold text-paper" : "text-paper/80 hover:text-paper"}`}>
                <Icon name={e.icon} className={large ? "size-6 text-paper/70" : "size-[1.15rem] text-paper/70"} />
                {e.label}
              </Link>
              {e.children && (
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : e.href)}
                  className="grid size-11 place-items-center text-paper/70 hover:text-paper"
                  aria-label={`${expanded ? "Hide" : "Show"} ${e.label} pages`}
                  aria-expanded={expanded}
                >
                  <Icon name="down" className={`size-5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
            {e.children && expanded && (
              <ul className={large ? "py-1 pl-14" : "py-1 pl-10"}>
                {e.children.map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      className={`block rounded-xl py-2 ${large ? "text-[1.05rem]" : "text-sm"} ${
                        !c.href.includes("?") && pathname.startsWith(c.href) ? "font-semibold text-paper" : "text-paper/70 hover:text-paper"
                      }`}
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MobileMenu({ pathname, email, onClose, signOut }: { pathname: string; email: string; onClose: () => void; signOut: () => void }) {
  useEffect(() => {
    const html = document.documentElement;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink text-paper animate-[fade_0.2s_ease] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="px-3 pb-36 pt-[max(env(safe-area-inset-top),1.25rem)]">
        <div className="mb-6 flex items-center gap-3 px-4">
          <Monogram className="h-11 w-9 shrink-0" arch="var(--color-silver)" letter="var(--color-brass-soft)" />
          <div className="min-w-0">
            <Logo className="block text-xl" accent="text-silver" />
            <p className="mt-0.5 truncate text-xs text-paper/50">{email}</p>
          </div>
        </div>
        <NavTree pathname={pathname} large />
        <p className="mt-8 px-4 text-sm font-semibold text-paper/50">Your store</p>
        <ul className="mt-2 space-y-0.5">
          <li>
            <Link href="/" target="_blank" className="flex items-center gap-4 rounded-2xl px-4 py-3.5 text-[1.15rem] text-paper/80">
              <span className="grid size-7 place-items-center rounded-lg bg-paper/15"><Icon name="store" className="size-4" /></span>
              View online store
            </Link>
          </li>
          <li>
            <button type="button" onClick={signOut} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-[1.15rem] text-paper/80">
              <span className="grid size-7 place-items-center rounded-lg bg-paper/15"><Icon name="logout" className="size-4" /></span>
              Sign out
            </button>
          </li>
        </ul>
      </div>
      <div className="fixed inset-x-0 bottom-0 flex items-center justify-center gap-3 pb-[max(env(safe-area-inset-bottom),0.9rem)]">
        <Link href="/admin/settings" className="grid size-14 place-items-center rounded-full border border-paper/15 bg-ink-soft" aria-label="Settings">
          <Icon name="settings" className="size-6" />
        </Link>
        <Link href="/admin/products/new" className="flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-r from-brass to-brass-deep px-7 text-[1.05rem] font-semibold text-paper shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <Icon name="plusCircle" className="size-6" /> Add product
        </Link>
        <button type="button" onClick={onClose} className="grid size-14 place-items-center rounded-full border border-paper/15 bg-ink-soft" aria-label="Close menu">
          <Icon name="close" className="size-6" />
        </button>
      </div>
    </div>
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

/** Page header used by every admin screen: a big title, with an optional back button and actions. */
export function AdminHeader({ title, action, back }: { title: string; action?: React.ReactNode; back?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-ivory/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl md:px-8 md:pt-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {back && <RoundButton icon="back" label="Back" href={back} />}
          <h1 className="truncate font-serif text-[2rem] font-medium leading-tight md:text-[2.4rem]">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  );
}

/** Width and spacing for the body of an admin page. */
export function AdminPage({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto space-y-5 px-4 pb-8 pt-2 md:px-8 md:pt-4 ${narrow ? "max-w-3xl" : "max-w-5xl"}`}>{children}</div>;
}
