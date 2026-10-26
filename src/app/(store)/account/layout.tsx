import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "My account", template: "%s · Ansh Arte" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <div className="container-lux max-w-5xl pb-16 pt-8 md:pt-12">{children}</div>;
}
