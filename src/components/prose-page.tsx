import { Breadcrumbs } from "./listing";

export function ProsePage({
  eyebrow,
  title,
  intro,
  path,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-lux pt-6 md:pt-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: title, href: path }]} />
      <article className="mx-auto max-w-2xl py-10 md:py-16">
        <header className="mb-12 text-center">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h1 className="heading-xl">{title}</h1>
          {intro && <p className="mt-6 text-lg leading-relaxed text-ink-soft">{intro}</p>}
        </header>
        <div className="space-y-6 leading-relaxed text-ink-soft [&_h2]:[font-family:var(--font-serif)] [&_h2]:font-medium [&_h2]:leading-[1.15] [&_h2]:text-[length:clamp(1.5rem,3vw,2rem)] [&_h2]:pt-6 [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink [&_ul]:space-y-2 [&_li_a]:underline [&_li_a]:underline-offset-4 [&_p_a]:underline [&_p_a]:underline-offset-4">
          {children}
        </div>
      </article>
    </div>
  );
}
