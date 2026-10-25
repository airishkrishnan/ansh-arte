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
    background_color: "#f7f3ec",
    theme_color: "#1e1b18",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
