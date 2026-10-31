"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "./account";
import { useCart } from "./cart";
import { BagIcon, ChevronIcon, CloseIcon, HeartIcon, MenuIcon, UserIcon } from "./icons";
import { BrandLogo } from "./brand";
import { SearchButton } from "./search";

export type NavItem = {
  name: string;
  href: string;
  children: { name: string; href: string }[];
  collections: { name: string; href: string }[];
};

export function Header({ nav, announcement }: { nav: NavItem[]; announcement: string }) {
  const { count, setOpen, ready } = useCart();
  const account = useAccount();
  const signedIn = account.ready && !!account.user;
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the menu after navigating
  useEffect(() => setMenu(false), [pathname]);

  // Over a full-bleed banner (marked with data-hero) the header starts see-through
  // and turns solid once the page scrolls. The home page has one, so start there
  // on the server to avoid a flash; then check the page itself.
  const [overHero, setOverHero] = useState(pathname === "/");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the page after navigating
    setOverHero(!!document.querySelector("[data-hero]"));
  }, [pathname]);
  const clear = overHero && !scrolled;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  return (
    <>
      {announcement && (
        <div className="bg-ink px-4 py-2 text-center text-[0.68rem] font-medium uppercase tracking-[0.2em] text-brass-soft">
          {announcement}
        </div>
      )}
      <header
        className={`sticky top-0 z-40 border-b transition-[background-color,border-color,color] duration-500 ${
          overHero ? "-mb-16 md:-mb-20" : ""
        } ${
          clear
            ? "border-transparent bg-gradient-to-b from-ink/45 to-transparent bg-no-repeat text-paper"
            : scrolled
              ? "border-line bg-ivory/90 text-ink backdrop-blur-md"
              : "border-transparent bg-ivory text-ink"
        }`}
      >
        <div className="container-lux grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMenu(true)}
              className="-ml-2 p-2 md:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="size-6" />
            </button>
            <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
              {nav.map((item) => (
                <div key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className="link-underline py-2 text-[0.78rem] font-semibold uppercase tracking-[0.16em]"
                  >
                    {item.name}
                  </Link>
                  {(item.children.length > 0 || item.collections.length > 0) && (
                    <div className="invisible absolute left-0 top-full z-50 w-[34rem] translate-y-2 opacity-0 transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="mt-3 grid grid-cols-2 gap-8 border border-line bg-paper p-7 text-ink shadow-[0_24px_60px_-30px_rgba(33,27,26,0.35)]">
                        {item.children.length > 0 && (
                          <div>
                            <p className="eyebrow mb-3">Shop by style</p>
                            <ul className="space-y-2">
                              {item.children.map((c) => (
                                <li key={c.href}>
                                  <Link href={c.href} className="font-serif text-xl hover:text-brass-deep">
                                    {c.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <p className="eyebrow mb-3">Collections</p>
                          <ul className="columns-2 gap-4 space-y-1.5 text-sm">
                            {item.collections.map((c) => (
                              <li key={c.href}>
                                <Link href={c.href} className="text-ink-soft hover:text-ink">
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Link
                href="/collections"
                className="link-underline py-2 text-[0.78rem] font-semibold uppercase tracking-[0.16em]"
              >
                Collections
              </Link>
            </nav>
          </div>

          <Link href="/" aria-label="Ansh Arte home" className="block justify-self-center">
            <BrandLogo className="h-14 w-auto md:h-[4.25rem]" tone={clear ? "silver-dark" : "oxidised"} />
          </Link>

          <div className="flex items-center justify-end gap-1 md:gap-3">
            <Link
              href="/about"
              className="link-underline mr-2 hidden text-[0.78rem] font-semibold uppercase tracking-[0.16em] lg:inline"
            >
              Our craft
            </Link>
            <SearchButton />
            <Link
              href="/account/wishlist"
              className="relative hidden p-2 md:block"
              aria-label={`Wishlist, ${account.wishlist.length} saved`}
            >
              <HeartIcon className="size-6" />
              {account.ready && account.wishlist.length > 0 && (
                <span className="absolute right-0.5 top-0.5 grid size-[1.1rem] place-items-center rounded-full bg-brass-deep text-[0.62rem] font-bold text-paper">
                  {account.wishlist.length}
                </span>
              )}
            </Link>
            {account.enabled && (
              <Link
                href={signedIn ? "/account" : "/account/login"}
                className="relative p-2"
                aria-label={signedIn ? "My account" : "Sign in"}
              >
                <UserIcon className="size-6" />
                {signedIn && <span className="absolute bottom-1.5 right-1.5 size-2 rounded-full bg-success" />}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative -mr-2 p-2"
              aria-label={`Open bag, ${count} items`}
            >
              <BagIcon className="size-6" />
              {ready && count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid size-[1.1rem] place-items-center rounded-full bg-brass-deep text-[0.62rem] font-bold text-paper">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${menu ? "" : "pointer-events-none"}`}
        aria-hidden={!menu}
      >
        <div
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${menu ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenu(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-ivory transition-transform duration-500 ease-[var(--ease-lux)] ${
            menu ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-label="Menu"
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Link href="/" aria-label="Ansh Arte home">
              <BrandLogo className="h-11 w-auto" tone="oxidised" />
            </Link>
            <button type="button" onClick={() => setMenu(false)} className="-mr-2 p-2" aria-label="Close menu">
              <CloseIcon className="size-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Mobile">
            {nav.map((item) => (
              <div key={item.href} className="border-b border-line py-4">
                <Link href={item.href} className="flex items-center justify-between font-serif text-3xl">
                  {item.name}
                  <ChevronIcon className="size-5 text-muted" />
                </Link>
                {item.children.length > 0 && (
                  <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                    {item.children.map((c) => (
                      <Link key={c.href} href={c.href} className="chip">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="space-y-4 py-6 text-sm font-semibold uppercase tracking-[0.16em]">
              <Link href="/collections" className="block">
                All collections
              </Link>
              <Link href="/about" className="block">
                Our craft
              </Link>
              <Link href="/care-guide" className="block">
                Jewellery care
              </Link>
              <Link href="/shipping-returns" className="block">
                Shipping & returns
              </Link>
              {account.enabled && (
                <Link href={signedIn ? "/account" : "/account/login"} className="block">
                  {signedIn ? "My account & orders" : "Sign in / Create account"}
                </Link>
              )}
              <Link href="/account/wishlist" className="block">
                Wishlist{account.wishlist.length > 0 ? ` (${account.wishlist.length})` : ""}
              </Link>
              <Link href="/track" className="block">
                Track your order
              </Link>
              <Link href="/contact" className="block">
                Contact
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
