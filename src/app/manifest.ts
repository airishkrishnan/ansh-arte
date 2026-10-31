import type { MetadataRoute } from "next";

// Makes the admin installable on a phone home screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ansh Arte Admin",
    short_name: "Ansh Arte",
    description: "Manage Ansh Arte products and orders",
    start_url: "/admin/orders",
    scope: "/",
    display: "standalone",
    background_color: "#f4ece6",
    theme_color: "#211b1a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
