import { samplePhoto } from "@/lib/samples";
import type { Material } from "@/lib/types";

export type ArtKind = "hoops" | "jhumkas" | "dangles" | "studs" | "rings";

/**
 * Stands in until a real product photo is uploaded: a sample photo while
 * SHOW_SAMPLE_PHOTOS is on, otherwise a quiet line illustration.
 */
export function ProductArt({
  kind,
  material,
  dark = false,
  className = "",
}: {
  kind: string;
  material: Material;
  dark?: boolean;
  className?: string;
}) {
  const sample = samplePhoto(kind, material);
  if (sample) {
    // eslint-disable-next-line @next/next/no-img-element -- static sample photo
    return <img src={sample} alt="" aria-hidden="true" loading="lazy" decoding="async" className={`object-cover ${className}`} />;
  }

  const silver = material === "german-silver";
  const metal = dark ? (silver ? "#d8d0cb" : "#c1a094") : silver ? "#8d8582" : "#916b60";
  const glow = dark ? (silver ? "#34302e" : "#3d2e2b") : silver ? "#ece6e2" : "#e8d8ce";
  const edge = dark ? "#211b1a" : "#f6efea";
  const gid = `g-${material}-${dark ? "d" : "l"}`;
  const stroke = { fill: "none", stroke: metal, strokeWidth: 2.2, strokeLinecap: "round" as const };

  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={gid} cx="50%" cy="48%" r="70%">
          <stop offset="0%" stopColor={glow} />
          <stop offset="100%" stopColor={edge} />
        </radialGradient>
      </defs>
      <rect x="-200" y="-200" width="800" height="900" fill={`url(#${gid})`} />
      {kind === "hoops" && (
        <g {...stroke}>
          <circle cx="200" cy="250" r="92" />
          <circle cx="200" cy="250" r="80" strokeOpacity="0.5" />
          <path d="M200 158v-30" />
          <circle cx="200" cy="122" r="6" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={200 + Math.cos(a) * 86} cy={250 + Math.sin(a) * 86} r="3" />;
          })}
        </g>
      )}
      {kind === "jhumkas" && (
        <g {...stroke}>
          <circle cx="200" cy="120" r="7" />
          <path d="M200 127v18" />
          <circle cx="200" cy="168" r="23" />
          <circle cx="200" cy="168" r="11" strokeOpacity="0.6" />
          <path d="M200 191v14" />
          <path d="M128 300c0-52 32-95 72-95s72 43 72 95z" />
          <path d="M146 300c4-38 26-70 54-70s50 32 54 70" strokeOpacity="0.5" />
          <path d="M128 300h144" />
          {Array.from({ length: 9 }).map((_, i) => (
            <g key={i}>
              <path d={`M${136 + i * 16} 300v20`} />
              <circle cx={136 + i * 16} cy="326" r="4.5" />
            </g>
          ))}
        </g>
      )}
      {kind === "dangles" && (
        <g {...stroke}>
          <circle cx="200" cy="110" r="7" />
          <path d="M200 117v28" />
          <path d="M200 145c34 30 52 66 52 104 0 46-24 82-52 104-28-22-52-58-52-104 0-38 18-74 52-104z" />
          <path d="M200 175c20 22 30 46 30 74s-13 56-30 74c-17-18-30-46-30-74s10-52 30-74z" strokeOpacity="0.5" />
          <path d="M200 353v26" />
          <circle cx="200" cy="388" r="8" />
        </g>
      )}
      {kind === "studs" && (
        <g {...stroke}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ellipse
              key={i}
              cx="200"
              cy="206"
              rx="20"
              ry="44"
              transform={`rotate(${i * 45} 200 250)`}
            />
          ))}
          <circle cx="200" cy="250" r="22" />
          <circle cx="200" cy="250" r="9" strokeOpacity="0.6" />
        </g>
      )}
      {(kind === "rings" || !["hoops", "jhumkas", "dangles", "studs"].includes(kind)) && (
        <g {...stroke}>
          <ellipse cx="200" cy="285" rx="96" ry="64" />
          <ellipse cx="200" cy="285" rx="80" ry="50" strokeOpacity="0.5" />
          <path d="M162 226l38-50 38 50" />
          <circle cx="200" cy="200" r="22" />
          <circle cx="200" cy="200" r="10" strokeOpacity="0.6" />
        </g>
      )}
    </svg>
  );
}
