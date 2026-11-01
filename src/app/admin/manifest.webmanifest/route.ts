import type { MetadataRoute } from "next";

// The admin as its own home-screen app, separate from the store app.
// Sheesham icon with a Muslin monogram, easy to tell apart from the store's Kohl icon.
export const dynamic = "force-static";

export function GET() {
  const manifest: MetadataRoute.Manifest = {
    id: "/admin/",
    name: "Ansh Arte Admin",
    short_name: "Ansh Admin",
    description: "Manage Ansh Arte orders, products and customers",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#211b1a",
    theme_color: "#211b1a",
    icons: [
      { src: "/icons/admin-icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/admin-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/admin-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/admin-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
