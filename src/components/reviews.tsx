import type { Review } from "@/lib/types";
import { StarIcon } from "./icons";
import { ReviewForm } from "./review-form";

export function Stars({ rating, className = "size-4" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex text-brass" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={className} filled={n <= Math.round(rating)} />
      ))}
    </span>
  );
}

export const averageRating = (reviews: Review[]) =>
  reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

const dateFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

/** Customer reviews with photos, a star summary and the write-a-review form. */
export function Reviews({ reviews, productId, productName }: { reviews: Review[]; productId: string; productName: string }) {
  const avg = averageRating(reviews);
  const counts = [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length);
  const photos = reviews.flatMap((r) => r.photos.map((url) => ({ url, name: r.name })));

  return (
    <section id="reviews" className="mt-20 scroll-mt-24 md:mt-28">
      <div className="grid gap-10 md:grid-cols-[18rem_1fr] md:gap-16">
        <div className="space-y-5">
          <div>
            <p className="eyebrow mb-3">Reviews</p>
            <h2 className="heading-lg">What customers say</h2>
          </div>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-serif text-5xl">{avg.toFixed(1)}</span>
                <div>
                  <Stars rating={avg} />
                  <p className="text-xs text-muted">
                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-ink-soft">
                {counts.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-3">{5 - i}</span>
                    <StarIcon className="size-3 text-brass" />
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <span className="block h-full bg-brass-deep" style={{ width: `${(c / reviews.length) * 100}%` }} />
                    </span>
                    <span className="w-4 text-right">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No reviews yet. Bought this piece? Be the first to share how it looks on you.</p>
          )}
          <ReviewForm productId={productId} productName={productName} />
        </div>

        <div className="space-y-8">
          {photos.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
              {photos.map((p) => (
                <a key={p.url} href={p.url} target="_blank" rel="noopener" className="aspect-square w-28 shrink-0 overflow-hidden bg-sand md:w-32">
                  {/* eslint-disable-next-line @next/next/no-img-element -- customer photo */}
                  <img src={p.url} alt={`Customer photo from ${p.name}`} loading="lazy" className="size-full object-cover" />
                </a>
              ))}
            </div>
          )}
          <ul className="divide-y divide-line border-y border-line">
            {reviews.map((r) => (
              <li key={r.id} className="space-y-2 py-6">
                <div className="flex items-center justify-between gap-4">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-muted">{dateFmt.format(new Date(r.created_at))}</span>
                </div>
                <p className="leading-relaxed text-ink-soft">{r.body}</p>
                {r.photos.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {r.photos.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener" className="size-16 overflow-hidden bg-sand">
                        {/* eslint-disable-next-line @next/next/no-img-element -- customer photo */}
                        <img src={url} alt="" loading="lazy" className="size-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                  {r.name}
                  {r.city && <span className="font-normal text-muted"> · {r.city}</span>}
                </p>
              </li>
            ))}
            {reviews.length === 0 && (
              <li className="py-10 text-center text-sm text-muted">Reviews with photos from customers will show here.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
