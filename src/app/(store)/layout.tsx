import { AccountProvider } from "@/components/account";
import { Analytics } from "@/components/analytics";
import { BagDrawer } from "@/components/bag-drawer";
import { CartProvider } from "@/components/cart";
import { Footer } from "@/components/footer";
import { Header, type NavItem } from "@/components/header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import {
  categoryHref,
  categoryTree,
  collectionsUnder,
  getCatalogue,
  getSettings,
  stylesOf,
  topCategories,
} from "@/lib/data";

// Pages read the catalogue live, so admin changes appear immediately.
export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [catalogue, settings] = await Promise.all([getCatalogue(), getSettings()]);
  const nav: NavItem[] = topCategories(catalogue).map((cat) => ({
    name: cat.name,
    href: categoryHref(catalogue, cat),
    children: stylesOf(catalogue, cat.id).map((s) => ({
      name: s.name,
      href: categoryHref(catalogue, s),
    })),
    collections: collectionsUnder(catalogue, categoryTree(catalogue, cat)).map((c) => ({
      name: c.name,
      href: `/collections/${c.slug}`,
    })),
  }));

  return (
    <AccountProvider>
    <CartProvider>
      <Header nav={nav} announcement={settings.announcement} />
      <main>{children}</main>
      <Footer nav={nav} settings={settings} />
      <BagDrawer freeShippingAbove={settings.free_shipping_above} />
      <WhatsAppFloat number={settings.whatsapp_number} />
      <Analytics />
    </CartProvider>
    </AccountProvider>
  );
}
