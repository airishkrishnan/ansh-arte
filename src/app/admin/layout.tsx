import type { Metadata, Viewport } from "next";
import { AdminShell } from "@/components/admin/shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
  // Installs as its own app, apart from the store: own name, icon and start page.
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Ansh Admin", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/admin-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/admin-apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = { themeColor: "#211b1a" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
