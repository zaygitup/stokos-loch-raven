"use client";

import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

type ClerkAuthControlsProps = {
  variant?: "main" | "store" | "admin";
};

export default function ClerkAuthControls({
  variant = "main",
}: ClerkAuthControlsProps) {
  const signInClass =
    variant === "admin"
      ? "rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-black uppercase text-green-800 transition hover:bg-green-50"
      : "rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-white/25";

  const signInMobileClass =
    "rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-green-700 transition hover:bg-green-50 shadow-sm";

  const signUpClass =
    variant === "admin"
      ? "rounded-full bg-[#16A34A] px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-green-700"
      : "rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-[#16A34A] transition hover:bg-green-50";

  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        {/* Mobile: prominent Sign In only */}
        <SignInButton mode="modal" forceRedirectUrl={variant === "admin" ? "/admin" : undefined}>
          <button type="button" className={`md:hidden ${signInMobileClass}`}>
            Sign In
          </button>
        </SignInButton>
        {/* Desktop: Sign In + Sign Up */}
        <SignInButton mode="modal" forceRedirectUrl={variant === "admin" ? "/admin" : undefined}>
          <button type="button" className={`hidden md:block ${signInClass}`}>
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal" forceRedirectUrl={variant === "admin" ? "/admin" : undefined}>
          <button type="button" className={`hidden md:block ${signUpClass}`}>
            Sign Up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link
          href="/account"
          className={
            variant === "admin"
              ? "rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-black uppercase text-green-800"
              : "rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-black uppercase text-white"
          }
        >
          Account
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </Show>
    </div>
  );
}
