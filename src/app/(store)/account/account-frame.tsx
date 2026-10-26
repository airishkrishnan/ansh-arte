"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { firstName, useAccount } from "@/components/account";

const TABS = [
  { href: "/account", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile & addresses" },
];

/**
 * Heading and tabs for the account pages. Sends signed-out visitors to the
 * sign-in page unless `guestOk` (the wishlist works without an account).
 */
export function AccountFrame({ children, guestOk = false }: { children: React.ReactNode; guestOk?: boolean }) {
  const account = useAccount();
  const pathname = usePathname();
  const router = useRouter();
  const signedIn = !!account.user;
  const mustSignIn = account.enabled && account.ready && !signedIn && !guestOk;

  useEffect(() => {
    if (mustSignIn) router.replace(`/account/login?next=${encodeURIComponent(pathname)}`);
  }, [mustSignIn, pathname, router]);

  if (!account.enabled && !guestOk) return <NotConnected />;
  if (!account.ready || mustSignIn) return <p className="py-24 text-center text-sm text-muted">Loading…</p>;

  return (
    <>
      <header className="mb-8 text-center">
        <p className="eyebrow mb-3">{signedIn ? "My account" : "Saved on this device"}</p>
        <h1 className="heading-lg">
          {signedIn ? `Hello${firstName(account.profile, account.user) ? `, ${firstName(account.profile, account.user)}` : ""}` : "Your wishlist"}
        </h1>
      </header>
      {signedIn && (
        <nav className="no-scrollbar -mx-4 mb-10 flex justify-start gap-2 overflow-x-auto px-4 md:justify-center" aria-label="Account">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="chip"
              aria-current={pathname === t.href ? "page" : undefined}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      )}
      {children}
    </>
  );
}

export function NotConnected() {
  return (
    <div className="py-20 text-center">
      <h1 className="heading-md">Accounts are almost ready</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
        Customer accounts switch on once the store is connected to Supabase (see SETUP.md). Until then you can still
        order as a guest and track your order with its number.
      </p>
      <Link href="/track" className="btn btn-primary mt-8">
        Track an order
      </Link>
    </div>
  );
}
