import { useId } from "react";
import {
  ARTE_PATH,
  LOGO_VIEWBOX,
  MARK_PATH,
  OXIDISED,
  SILVER_DARK,
  SILVER_LIGHT,
  type LogoGradient,
} from "@/lib/logo-paths";

/**
 * Logo versions, from the official logo files and the Brand Book (page 11).
 * - silver: primary, for light backgrounds at 100px and up (footer-size marks, banners)
 * - silver-dark: for Kohl, charcoal and dark photos
 * - oxidised: one colour, for print and small marks on light grounds such as the header
 * - white: on Rosewood and busy photos
 * - current: follows the surrounding text colour
 */
export type LogoTone = "silver" | "silver-dark" | "oxidised" | "white" | "current";

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
  const grads = tone === "silver" ? SILVER_LIGHT : tone === "silver-dark" ? SILVER_DARK : null;
  const solid = tone === "oxidised" ? OXIDISED : tone === "white" ? "#FFFFFF" : "currentColor";
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
      {withName && <path fill={grads ? `url(#${id}a)` : solid} d={ARTE_PATH} />}
    </svg>
  );
}

/**
 * The full Ansh Arte logo (monogram with the hairline "arte").
 * The Brand Book asks for at least 300px of width on screen; below that use `BrandMonogram`.
 */
export function BrandLogo({
  tone = "silver",
  className = "",
  title = "Ansh Arte",
}: {
  tone?: LogoTone;
  className?: string;
  title?: string;
}) {
  return <Mark tone={tone} withName className={className} title={title} />;
}

/** The "anh" monogram alone: for the header, avatars, icons and small sizes (64px wide or more). */
export function BrandMonogram({
  tone = "silver",
  className = "",
  title,
}: {
  tone?: LogoTone;
  className?: string;
  title?: string;
}) {
  return <Mark tone={tone} withName={false} className={className} title={title} />;
}
