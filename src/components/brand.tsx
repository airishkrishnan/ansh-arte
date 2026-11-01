import { useId } from "react";
import {
  ARTE_PATH,
  BRASS,
  GERMAN_SILVER,
  LOGO_VIEWBOX,
  MARK_PATH,
  OXIDISED,
  SILVER_DARK,
  SILVER_LIGHT,
  type LogoGradient,
} from "@/lib/logo-paths";

/**
 * Logo colour versions, from the Brand Guidelines (Edition 01, page 07).
 * - brass: Oxidised Brass on Ivory, the primary logo on light grounds
 * - silver-dark: German Silver on Kohl, the signature version on dark grounds and photos
 * - flat-silver: single-colour German Silver (on Espresso)
 * - muslin: tonal, on Sheesham or Mauve Taupe
 * - silver: the lighter silver gradient from the logo files
 * - oxidised: one dark colour, for small marks and print
 * - white: over busy photos
 * - current: follows the surrounding text colour
 */
export type LogoTone =
  | "brass"
  | "silver"
  | "silver-dark"
  | "flat-silver"
  | "muslin"
  | "oxidised"
  | "white"
  | "current";

const SOLID: Partial<Record<LogoTone, string>> = {
  "flat-silver": GERMAN_SILVER,
  muslin: "#E8D8CE",
  oxidised: OXIDISED,
  white: "#FFFFFF",
};

const [, , vbW, vbH] = LOGO_VIEWBOX.split(" ");
const LOGO_ASPECT = `${vbW} / ${vbH}`;

function Gradient({ id, g }: { id: string; g: LogoGradient }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
      {g.stops.map(([o, c]) => (
        <stop key={o} offset={o} stopColor={c} />
      ))}
    </linearGradient>
  );
}

function Mark({
  tone,
  withName,
  className,
  title,
}: {
  tone: LogoTone;
  withName: boolean;
  className: string;
  title?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const grads =
    tone === "brass" ? BRASS : tone === "silver" ? SILVER_LIGHT : tone === "silver-dark" ? SILVER_DARK : null;
  const solid = SOLID[tone] ?? "currentColor";
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={className}
      // Lets `h-* w-auto` size the mark without the 300px default width of an inline SVG
      style={{ aspectRatio: LOGO_ASPECT }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {grads && (
        <defs>
          <Gradient id={`${id}m`} g={grads[0]} />
          <Gradient id={`${id}a`} g={grads[1]} />
        </defs>
      )}
      <path fill={grads ? `url(#${id}m)` : solid} d={MARK_PATH} />
      {withName && (
        <path
          fill={grads ? `url(#${id}a)` : solid}
          d={ARTE_PATH}
          // A hairline outline keeps "arte" visible when the logo is small (header, icons);
          // at large sizes it adds well under a pixel.
          stroke={grads ? `url(#${id}a)` : solid}
          strokeWidth={0.6}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

/**
 * The primary Ansh Arte logo (monogram with "arte" set wide beneath).
 * Minimum 120px wide on screen; below that use `BrandMonogram` or `BrandLockup`.
 */
export function BrandLogo({
  tone = "brass",
  className = "",
  title = "Ansh Arte",
}: {
  tone?: LogoTone;
  className?: string;
  title?: string;
}) {
  return <Mark tone={tone} withName className={className} title={title} />;
}

/** The monogram alone: favicons, app icons, avatars and tight spaces (32px wide or more). */
export function BrandMonogram({
  tone = "brass",
  className = "",
  title,
}: {
  tone?: LogoTone;
  className?: string;
  title?: string;
}) {
  return <Mark tone={tone} withName={false} className={className} title={title} />;
}

/**
 * Horizontal lockup (guidelines page 08): the monogram beside the name in Poppins Light,
 * with the descriptor beneath. For website headers and other wide, short spaces.
 * `dark` sets it for Kohl grounds and photos (German Silver mark, Muslin name).
 */
export function BrandLockup({
  dark = false,
  descriptor = true,
  className = "",
}: {
  dark?: boolean;
  descriptor?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 md:gap-4 ${className}`} role="img" aria-label="Ansh Arte">
      <Mark tone={dark ? "silver-dark" : "oxidised"} withName={false} className="h-[3em] w-auto" />
      <span aria-hidden className={`h-[2.4em] w-px ${dark ? "bg-silver/70" : "bg-silver"}`} />
      <span aria-hidden className="flex flex-col items-start leading-none">
        <span
          className={`font-sans text-[1em] font-light uppercase tracking-[0.32em] ${dark ? "text-brass-soft" : "text-ink"}`}
        >
          Ansh Arte
        </span>
        {descriptor && (
          <span
            className={`mt-[0.6em] font-sans text-[0.5em] font-normal uppercase tracking-[0.24em] ${
              dark ? "text-silver" : "text-brass"
            }`}
          >
            Oxidised Brass &amp; German Silver
          </span>
        )}
      </span>
    </span>
  );
}
