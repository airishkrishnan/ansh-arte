import type { Metadata } from "next";
import { AccountFrame } from "../account-frame";
import { WishlistView } from "./wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <AccountFrame guestOk>
      <WishlistView />
    </AccountFrame>
  );
}
