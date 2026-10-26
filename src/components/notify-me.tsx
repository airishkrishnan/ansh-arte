"use client";

import { useState } from "react";
import { BellIcon, CheckIcon } from "./icons";

/** Sold-out pieces: leave a WhatsApp number to hear when it is back. */
export function NotifyMe({ productId }: { productId: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  if (state === "done") {
    return (
      <p className="flex items-start gap-3 border border-success/30 bg-success/5 p-4 text-sm text-success">
        <CheckIcon className="mt-0.5 size-4 shrink-0" />
        Done! We&apos;ll message you on WhatsApp as soon as this piece is back.
      </p>
    );
  }

  return (
    <form
      className="space-y-3 border border-line bg-paper p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setState("sending");
        const website = (e.currentTarget.elements.namedItem("website") as HTMLInputElement).value;
        const res = await fetch("/api/stock-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId, name, phone, website }),
        }).catch(() => null);
        if (res?.ok) return setState("done");
        setError((await res?.json().catch(() => null))?.error ?? "Something went wrong. Please try again.");
        setState("idle");
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-temple">Sold out</p>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <BellIcon className="size-5 text-brass-deep" />
        Notify me on WhatsApp when it&apos;s back
      </p>
      <div className="grid grid-cols-[1fr_1.3fr] gap-2">
        <label className="sr-only" htmlFor="notify-name">Your name</label>
        <input id="notify-name" className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        <label className="sr-only" htmlFor="notify-phone">WhatsApp number</label>
        <input
          id="notify-phone"
          className="field"
          placeholder="WhatsApp number"
          inputMode="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error && <p className="text-sm text-temple">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={state === "sending"}>
        {state === "sending" ? "Saving…" : "Notify me"}
      </button>
    </form>
  );
}
