import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd, Listing, breadcrumbJsonLd, parseMaterial, parseSort } from "@/components/listing";
import { categoryHref, categoryPath, collectionsUnder, getCatalogue, getProducts } from "@/lib/data";
import { OG_IMAGE, SITE_URL } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load(slug: string) {
  const catalogue = await getCatalogue();
  const collection = catalogue.collections.find((c) => c.slug === slug);
  return { catalogue, collection };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { catalogue, collection } = await load(slug);
  if (!collection) return {};
  const path = categoryPath(catalogue, collection.category_id);
  const kind = path.at(-1)?.name ?? "";
  const title = `${collection.name} Collection${kind ? ` · ${kind}` : ""}`;
  const description = collection.story || `${collection.tagline}. Handcrafted ${kind.toLowerCase()} in oxidised brass and German silver by Ansh Arte.`;
  return {
    title,
    description,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: {
      title,
      description,
      url: `/collections/${collection.slug}`,
      images: [collection.banner_url ?? OG_IMAGE],
    },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { catalogue, collection } = await load(slug);
  if (!collection) notFound();

  const material = parseMaterial(sp.material);
  const sort = parseSort(sp.sort);
  const products = await getProducts({ collectionId: collection.id, material, sort });
  const path = categoryPath(catalogue, collection.category_id);
  const siblings = collectionsUnder(catalogue, [collection.category_id]);
  const crumbs = [
    { name: "Home", href: "/" },
    ...path.map((c) => ({ name: c.name, href: categoryHref(catalogue, c) })),
    { name: collection.name, href: `/collections/${collection.slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE_URL)} />
      {collection.banner_url && (
        <div className="relative h-[42vh] min-h-64 overflow-hidden bg-sand md:h-[56vh]">
          {/* eslint-disable-next-line @next/next/no-img-element -- collection banner */}
          <img src={collection.banner_url} alt={collection.name} className="size-full object-cover" fetchPriority="high" />
        </div>
      )}
      <Listing
        catalogue={catalogue}
        crumbs={crumbs}
        eyebrow={`${path.at(-1)?.name ?? ""} collection`}
        title={collection.name}
        description={collection.story || collection.tagline}
        chips={siblings.map((c) => ({
          name: c.name,
          href: `/collections/${c.slug}`,
          current: c.id === collection.id,
        }))}
        products={products}
        basePath={`/collections/${collection.slug}`}
        material={material}
        sort={sort}
      />
    </>
  );
}
