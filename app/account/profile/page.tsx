"use client";

import { UserProfile } from "@clerk/nextjs";

export default function AccountProfilePage() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-zinc-200">
      <UserProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none rounded-none border-none",
            card: "shadow-none rounded-none border-none",
            navbar: "border-r border-zinc-100",
            navbarMobileMenuButton: "rounded-xl",
            pageScrollBox: "px-6 py-6",
            footer: "hidden",
          },
        }}
      />
    </div>
  );
}
