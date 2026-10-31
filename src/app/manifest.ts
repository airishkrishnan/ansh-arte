import type { MetadataRoute } from "next";

// The store as a home-screen app. The admin has its own app: see admin/manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Ansh Arte",
    short_name: "Ansh Arte",
    description: "Handcrafted oxidised jewellery from Ansh Arte",
    start_url: "/",
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
