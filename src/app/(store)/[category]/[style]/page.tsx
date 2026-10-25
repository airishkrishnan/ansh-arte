import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd, Listing, breadcrumbJsonLd, parseMaterial, parseSort } from "@/components/listing";
import { getCatalogue, getProducts, stylesOf, topCategories } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

type Props = {
  params: Promise<{ category: string; style: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load(categorySlug: string, styleSlug: string) {
  const catalogue = await getCatalogue();
  const category = topCategories(catalogue).find((c) => c.slug === categorySlug);
  const style = category && stylesOf(catalogue, category.id).find((s) => s.slug === styleSlug);
  return { catalogue, category, style };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const { category, style } = await load(p.category, p.style);
  if (!category || !style) return {};
  const title = `${style.name} ${category.name === "Earrings" ? "Earrings" : category.name}: Oxidised & German Silver`;
  const url = `/${category.slug}/${style.slug}`;
  return {
    title,
    description: style.description,
    alternates: { canonical: url },
    openGraph: { title, description: style.description, url },
  };
}

export default async function StylePage({ params, searchParams }: Props) {
  const [p, sp] = await Promise.all([params, searchParams]);
  const { catalogue, category, style } = await load(p.category, p.style);
  if (!category || !style) notFound();

  const material = parseMaterial(sp.material);
  const sort = parseSort(sp.sort);
  const products = await getProducts({ categoryIds: [style.id], material, sort });
  const base = `/${category.slug}/${style.slug}`;
  const chips = [
    { name: `All ${category.name.toLowerCase()}`, href: `/${category.slug}`, current: false },
    ...stylesOf(catalogue, category.id).map((s) => ({
      name: s.name,
      href: `/${category.slug}/${s.slug}`,
      current: s.id === style.id,
    })),
  ];
  const crumbs = [
    { name: "Home", href: "/" },
    { name: category.name, href: `/${category.slug}` },
    { name: style.name, href: base },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs, SITE_URL)} />
      <Listing
        catalogue={catalogue}
        crumbs={crumbs}
        eyebrow={category.name}
        title={style.name}
        description={style.description}
        chips={chips}
        products={products}
        basePath={base}
        material={material}
        sort={sort}
      />
    </>
  );
}
