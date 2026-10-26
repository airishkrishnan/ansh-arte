"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/account";
import { CheckIcon } from "@/components/icons";
import { getCustomerSupabase } from "@/lib/supabase/client";
import { NotConnected } from "../account-frame";

// Set NEXT_PUBLIC_GOOGLE_SIGNIN=on once Google is switched on in Supabase (SETUP.md)
const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === "on";

const PERKS = [
  "Follow every order from WhatsApp to your doorstep",
  "Keep a wishlist on your phone and laptop",
  "Checkout in one tap with saved addresses",
];

export function LoginForm({ next }: { next: string }) {
  const account = useAccount();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);

  // Signed in (here, by Google, or by the email link): go on to where they were headed
  useEffect(() => {
    if (account.ready && account.user) router.replace(next);
  }, [account.ready, account.user, next, router]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  if (!account.enabled) return <NotConnected />;

  const back = () => `${window.location.origin}/account/login?next=${encodeURIComponent(next)}`;

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await getCustomerSupabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true, emailRedirectTo: back() },
    });
    setBusy(false);
    if (error) {
      setError(
        /rate|limit|seconds/i.test(error.message)
          ? "Please wait a minute before asking for another code."
          : error.message,
      );
      return;
    }
    setStep("code");
    setCode("");
    setWait(60);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await getCustomerSupabase().auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setError(/expired|invalid/i.test(error.message) ? "That code is wrong or has expired. Try again or send a new one." : error.message);
  };

  const google = async () => {
    setError("");
    const { error } = await getCustomerSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: back() },
    });
    if (error) setError("Google sign-in isn't switched on yet. Please use your email for now.");
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-[1fr_1fr] md:gap-16">
      <div className="order-2 md:order-1 md:pt-16">
        <p className="eyebrow mb-3">Your Ansh Arte account</p>
        <h2 className="heading-md mb-6">Jewellery you love, all in one place</h2>
        <ul className="space-y-4">
          {PERKS.map((p) => (
            <li key={p} className="flex gap-3 text-sm text-ink-soft">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brass-soft text-brass-deep">
                <CheckIcon className="size-3" />
              </span>
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-muted">
          No password to remember. New here? Signing in creates your account.
        </p>
      </div>

      <div className="order-1 border border-line bg-paper p-6 md:order-2 md:p-9">
        <h1 className="heading-md mb-2 text-center">{step === "email" ? "Sign in or create account" : "Check your email"}</h1>

        {step === "email" ? (
          <>
            <p className="mb-7 text-center text-sm text-ink-soft">We&rsquo;ll email you a code. No password needed.</p>
            {GOOGLE && (
              <>
                <button type="button" onClick={google} className="btn btn-outline w-full !normal-case !tracking-normal">
                  <GoogleMark /> Continue with Google
                </button>
                <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted">
                  <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
                </div>
              </>
            )}
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="field"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-temple">{error}</p>}
              <button className="btn btn-primary w-full" disabled={busy}>
                {busy ? "Sending…" : "Email me a code"}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <p className="mb-3 text-center text-sm text-ink-soft">
              We sent a code to <strong className="text-ink">{email}</strong>. Enter it below, or tap the link in the
              email. Check your spam folder if it&rsquo;s not there in a minute.
            </p>
            <div>
              <label className="label" htmlFor="code">Code from the email</label>
              <input
                id="code"
                className="field text-center font-serif text-3xl tracking-[0.4em]"
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6,10}"
                maxLength={10}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {error && <p className="text-sm text-temple">{error}</p>}
            <button className="btn btn-primary w-full" disabled={busy || code.length < 6}>
              {busy ? "Checking…" : "Sign in"}
            </button>
            <div className="flex justify-between text-xs">
              <button type="button" className="text-ink-soft underline underline-offset-4" onClick={() => setStep("email")}>
                Use a different email
              </button>
              <button
                type="button"
                className="text-ink-soft underline underline-offset-4 disabled:no-underline disabled:opacity-60"
                disabled={wait > 0 || busy}
                onClick={() => sendCode()}
              >
                {wait > 0 ? `Send again in ${wait}s` : "Send a new code"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-muted">
          Just want to check one order?{" "}
          <Link href="/track" className="underline underline-offset-4">
            Track it without signing in
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}
