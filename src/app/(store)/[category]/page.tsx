import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd, Listing, breadcrumbJsonLd, parseMaterial, parseSort } from "@/components/listing";
import { categoryTree, collectionsUnder, getCatalogue, getProducts, stylesOf, topCategories } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load(slug: string) {
  const catalogue = await getCatalogue();
  const category = topCategories(catalogue).find((c) => c.slug === slug);
  return { catalogue, category };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const { category } = await load(slug);
  if (!category) return {};
  const title = `${category.name} in Oxidised Brass & German Silver`;
  return {
    title,
    description: category.description,
    alternates: { canonical: `/${category.slug}` },
    openGraph: { title, description: category.description, url: `/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category: slug }, sp] = await Promise.all([params, searchParams]);
  const { catalogue, category } = await load(slug);
  if (!category) notFound();

  const material = parseMaterial(sp.material);
  const sort = parseSort(sp.sort);
  const products = await getProducts({ categoryIds: categoryTree(catalogue, category), material, sort });
  const styles = stylesOf(catalogue, category.id);
  const chips = styles.length
    ? [
        { name: `All ${category.name.toLowerCase()}`, href: `/${category.slug}`, current: true },
        ...styles.map((s) => ({ name: s.name, href: `/${category.slug}/${s.slug}`, current: false })),
      ]
    : collectionsUnder(catalogue, [category.id]).map((c) => ({
        name: c.name,
        href: `/collections/${c.slug}`,
        current: false,
      }));
  const crumbs = [
    { name: "Home", href: "/" },
    { name: category.name, href: `/${category.slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE_URL)} />
      <Listing
        catalogue={catalogue}
        crumbs={crumbs}
        eyebrow="Handcrafted"
        title={category.name}
        description={category.description}
        chips={chips}
        products={products}
        basePath={`/${category.slug}`}
        material={material}
        sort={sort}
      />
    </>
  );
}
