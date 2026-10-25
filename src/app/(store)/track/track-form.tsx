"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrackForm() {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ number, phone }),
        });
        const data = await res.json();
        if (res.ok) router.push(data.url);
        else {
          setError(data.error);
          setBusy(false);
        }
      }}
    >
      <div>
        <label className="label" htmlFor="num">Order number</label>
        <input id="num" className="field uppercase" required placeholder="AA-1001" value={number} onChange={(e) => setNumber(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="ph">WhatsApp number</label>
        <input id="ph" className="field" required type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {error && <p className="text-sm text-temple">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Finding…" : "Track order"}
      </button>
    </form>
  );
}
