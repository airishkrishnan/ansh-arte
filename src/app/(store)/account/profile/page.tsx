import type { Metadata } from "next";
import { AccountFrame } from "../account-frame";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Profile & addresses" };

export default function ProfilePage() {
  return (
    <AccountFrame>
      <ProfileView />
    </AccountFrame>
  );
}
