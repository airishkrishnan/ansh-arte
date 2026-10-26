"use client";

import { useAccount } from "./account";
import { HeartIcon } from "./icons";

/** Heart toggle. `icon` sits on a product photo; `full` is a button on the product page. */
export function WishlistButton({
  productId,
  name,
  variant = "icon",
}: {
  productId: string;
  name: string;
  variant?: "icon" | "full";
}) {
  const { inWishlist, toggleWishlist } = useAccount();
  const saved = inWishlist(productId);
  const label = saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`;

  if (variant === "full") {
    return (
      <button type="button" onClick={() => toggleWishlist(productId)} className="btn btn-outline w-full" aria-pressed={saved}>
        <HeartIcon className="size-4" filled={saved} />
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId)}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      className={`grid size-9 place-items-center rounded-full bg-paper/85 backdrop-blur transition-colors hover:bg-paper ${
        saved ? "text-brass-deep" : "text-ink-soft"
      }`}
    >
      <HeartIcon className="size-[1.15rem]" filled={saved} />
    </button>
  );
}
