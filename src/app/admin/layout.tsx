import type { Metadata, Viewport } from "next";
import { AdminShell } from "@/components/admin/shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Ansh Arte", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#1e1b18" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
