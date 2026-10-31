"use client";

import { useState } from "react";
import { supabaseConfigured } from "@/lib/supabase/client";
import { CameraIcon, CheckIcon, CloseIcon, StarIcon } from "./icons";

const LABELS = ["", "Not for me", "It's okay", "Good", "Love it", "A part of me now"];

/** Write a review: stars, a few words and up to three photos. Held for approval. */
export function ReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  if (state === "done") {
    return (
      <p className="flex items-start gap-3 border border-success/30 bg-success/5 p-4 text-sm text-success">
        <CheckIcon className="mt-0.5 size-4 shrink-0" />
        Thank you! Your review will appear here once we&apos;ve had a look.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-outline" onClick={() => setOpen(true)}>
        Write a review
      </button>
    );
  }

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!supabaseConfigured) return setError("Photo upload works once the store is connected to Supabase.");
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, 3 - photos.length)) {
        const { uploadReviewPhoto } = await import("@/lib/review-photo");
        urls.push(await uploadReviewPhoto(f));
      }
      setPhotos((p) => [...p, ...urls].slice(0, 3));
    } catch {
      setError("That photo could not be uploaded. Try a smaller JPG or PNG.");
    }
    setUploading(false);
  };

  return (
    <form
      className="space-y-4 border border-line bg-paper p-5 md:p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) return setError("Please choose a star rating.");
        setError("");
        setState("sending");
        const website = (e.currentTarget.elements.namedItem("website") as HTMLInputElement).value;
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId, rating, name, city, body, photos, website }),
        }).catch(() => null);
        if (res?.ok) return setState("done");
        setError((await res?.json().catch(() => null))?.error ?? "Something went wrong. Please try again.");
        setState("idle");
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-serif text-xl">Review {productName}</p>
        <button type="button" className="-mr-2 -mt-1 p-2" onClick={() => setOpen(false)} aria-label="Close review form">
          <CloseIcon />
        </button>
      </div>

      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="grid size-11 place-items-center text-brass"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
            >
              <StarIcon className="size-7" filled={n <= (hover || rating)} />
            </button>
          ))}
          <span className="ml-2 text-sm text-ink-soft">{LABELS[hover || rating]}</span>
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="review-name">Name</label>
          <input id="review-name" className="field" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        </div>
        <div>
          <label className="label" htmlFor="review-city">City (optional)</label>
          <input id="review-city" className="field" maxLength={40} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="review-body">Your review</label>
        <textarea
          id="review-body"
          className="field min-h-28"
          required
          maxLength={1000}
          placeholder="How does it look and feel? Where did you wear it?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div>
        <p className="label">Photos (optional, up to 3)</p>
        <div className="flex flex-wrap gap-2">
          {photos.map((url) => (
            <div key={url} className="relative size-20 overflow-hidden bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element -- uploaded review photo preview */}
              <img src={url} alt="" className="size-full object-cover" />
              <button
                type="button"
                className="absolute right-0.5 top-0.5 grid size-6 place-items-center rounded-full bg-ink/70 text-paper"
                onClick={() => setPhotos((p) => p.filter((x) => x !== url))}
                aria-label="Remove photo"
              >
                <CloseIcon className="size-3.5" />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <label className="grid size-20 cursor-pointer place-items-center border border-dashed border-line text-muted hover:border-ink hover:text-ink">
              <span className="flex flex-col items-center gap-1 text-[0.72rem] font-semibold uppercase tracking-[0.1em]">
                <CameraIcon />
                {uploading ? "Adding…" : "Add"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error && <p className="text-sm text-temple">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={state === "sending" || uploading}>
        {state === "sending" ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
