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
    background_color: "#f6efea",
    theme_color: "#211b1a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
