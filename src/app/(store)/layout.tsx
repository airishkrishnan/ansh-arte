import { AccountProvider } from "@/components/account";
import { Analytics } from "@/components/analytics";
import { BagDrawer } from "@/components/bag-drawer";
import { CartProvider } from "@/components/cart";
import { Footer, type StripItem } from "@/components/footer";
import { Header, type NavItem } from "@/components/header";
import { Motion } from "@/components/motion";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import {
  artKind,
  categoryHref,
  categoryTree,
  collectionsUnder,
  getCatalogue,
  getProducts,
  getSettings,
  stylesOf,
  topCategories,
} from "@/lib/data";
import { samplePhoto } from "@/lib/samples";

// Pages read the catalogue live, so admin changes appear immediately.
export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [catalogue, settings, latest] = await Promise.all([
    getCatalogue(),
    getSettings(),
    getProducts({ sort: "new", limit: 6 }),
  ]);
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

  // Footer photo strip: the newest pieces
  const strip: StripItem[] = latest.map((p) => ({
    slug: p.slug,
    name: p.name,
    image: p.images[0]?.thumb ?? p.images[0]?.url ?? samplePhoto(artKind(catalogue, p), p.material),
  }));

  return (
    <AccountProvider>
    <CartProvider>
      <Header nav={nav} announcement={settings.announcement} />
      <main>{children}</main>
      <Footer nav={nav} settings={settings} strip={strip} />
      <BagDrawer freeShippingAbove={settings.free_shipping_above} />
      <WhatsAppFloat number={settings.whatsapp_number} />
      <Analytics />
      <Motion />
    </CartProvider>
    </AccountProvider>
  );
}
