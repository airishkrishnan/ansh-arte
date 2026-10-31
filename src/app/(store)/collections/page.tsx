import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/listing";
import { ProductArt } from "@/components/product-art";
import { categoryTree, collectionsUnder, getCatalogue, stylesOf, topCategories } from "@/lib/data";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Explore Ansh Arte collections: Maharani, Temple Bells, Mayuri, Halo, Celestial and more, handcrafted in oxidised brass and German silver.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const catalogue = await getCatalogue();
  return (
    <div className="container-lux pt-6 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Collections", href: "/collections" }]} />
      <header className="mx-auto max-w-2xl py-10 text-center md:py-14">
        <p className="eyebrow mb-3">The edit</p>
        <h1 className="heading-xl">Collections</h1>
        <p className="mt-5 text-ink-soft md:text-lg">
          Every collection begins with a story. Find the one that speaks to you.
        </p>
      </header>

      {topCategories(catalogue).map((cat) => {
        const styles = stylesOf(catalogue, cat.id);
        const groups = styles.length ? styles : [cat];
        return (
          <section key={cat.id} className="mb-16">
            <h2 className="heading-lg mb-8 border-b border-line pb-4">{cat.name}</h2>
            <div className="space-y-12">
              {groups.map((g) => {
                const cols = collectionsUnder(catalogue, g.id === cat.id ? categoryTree(catalogue, cat) : [g.id]);
                if (!cols.length) return null;
                return (
                  <div key={g.id}>
                    {g.id !== cat.id && <p className="eyebrow mb-5">{g.name}</p>}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
                      {cols.map((c, i) => (
                        <Link key={c.id} href={`/collections/${c.slug}`} className="group block">
                          <div className="overflow-hidden rounded-t-full bg-sand">
                            {c.banner_url ? (
                              // eslint-disable-next-line @next/next/no-img-element -- collection banner
                              <img src={c.banner_url} alt={c.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                              <ProductArt
                                kind={g.slug}
                                material={i % 2 ? "german-silver" : "oxidised-brass"}
                                className="aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-105"
                              />
                            )}
                          </div>
                          <h3 className="mt-4 font-serif text-2xl">{c.name}</h3>
                          <p className="mt-1 text-sm text-ink-soft">{c.tagline}</p>
                          <span className="mt-2 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-brass-deep">
                            Explore <ArrowIcon className="size-3.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
