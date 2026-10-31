import { useId } from "react";
import { ARTE_PATH, LOGO_VIEWBOX, MONOGRAM_PATH } from "@/lib/logo-paths";

/**
 * Logo versions from the Ansh Arte Brand Book (page 11).
 * - silver: primary, for light backgrounds
 * - silver-dark: for Kohl and charcoal backgrounds
 * - oxidised: one colour (Kohl)
 * - white: on Rosewood, photos and dark packs
 * - current: follows the surrounding text colour
 */
export type LogoTone = "silver" | "silver-dark" | "oxidised" | "white" | "current";

const [, , vbW, vbH] = LOGO_VIEWBOX.split(" ");
const LOGO_ASPECT = `${vbW} / ${vbH}`;

// Brand Book page 15: silver gradients, run at 45° across the whole mark.
const SILVER_LIGHT = ["#62676E", "#989DA4", "#B3B7BD", "#8E939A", "#6A6F76", "#A7ACB2", "#B6BAC0", "#5F646B"];
const SILVER_DARK = ["#7D8289", "#C9CDD2", "#F4F5F7", "#B4B8BE", "#8E939A", "#D8DBDF", "#FBFCFD", "#868B92"];

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
  const stops = tone === "silver" ? SILVER_LIGHT : tone === "silver-dark" ? SILVER_DARK : null;
  const fill = stops
    ? `url(#${id})`
    : tone === "oxidised"
      ? "#211B1A"
      : tone === "white"
        ? "#FFFFFF"
        : "currentColor";
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
      {stops && (
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            {stops.map((c, i) => (
              <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />
            ))}
          </linearGradient>
        </defs>
      )}
      <path fill={fill} fillRule="evenodd" d={withName ? MONOGRAM_PATH + ARTE_PATH : MONOGRAM_PATH} />
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
