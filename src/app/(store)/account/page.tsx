import type { Metadata } from "next";
import { AccountFrame } from "./account-frame";
import { MyOrders } from "./my-orders";

export const metadata: Metadata = { title: "My orders" };

export default function AccountPage() {
  return (
    <AccountFrame>
      <MyOrders />
    </AccountFrame>
  );
}
