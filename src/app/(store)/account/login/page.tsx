import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  // Only ever send people back to a page on this site
  const safeNext = typeof next === "string" && /^\/(?!\/)/.test(next) ? next : "/account";
  return <LoginForm next={safeNext} />;
}
