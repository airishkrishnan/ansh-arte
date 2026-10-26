import type { Material } from "./types";

/**
 * AI-generated sample photos shown wherever a product, style or collection has
 * no real photo yet, so the store can be previewed fully dressed. A real photo
 * uploaded in the admin always wins. Set this to false to go back to the line
 * illustrations.
 */
export const SHOW_SAMPLE_PHOTOS = true;

const SAMPLES: Record<string, Record<Material, string>> = {
  jhumkas: { "oxidised-brass": "/samples/jhumka-brass.webp", "german-silver": "/samples/jhumka-silver.webp" },
  hoops: { "oxidised-brass": "/samples/hoops-silver.webp", "german-silver": "/samples/hoops-silver.webp" },
  dangles: { "oxidised-brass": "/samples/dangles-brass.webp", "german-silver": "/samples/dangles-brass.webp" },
  studs: { "oxidised-brass": "/samples/studs-silver.webp", "german-silver": "/samples/studs-silver.webp" },
  rings: { "oxidised-brass": "/samples/ring-silver.webp", "german-silver": "/samples/ring-silver.webp" },
};

export const samplePhoto = (kind: string, material: Material) =>
  SHOW_SAMPLE_PHOTOS ? (SAMPLES[kind] ?? SAMPLES.jhumkas)[material] : null;
