"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import Image from "next/image";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function MainNavbar() {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("main_theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("main_theme", "light");
      setIsDark(false);
    }
  }, []);

  // Close mobile menu on route change / scroll
  useEffect(() => {
    const close = () => setMobileMenuOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;

    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("main_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("main_theme", "light");
    }

    setIsDark(nextDark);
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Menu", href: "/mainwebsite/location?action=menu" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#16A34A] text-white shadow-sm transition-colors duration-300 dark:border-b dark:border-white/10 dark:bg-[#003b11]">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10">
          {/* Top Row */}
          <div className="relative flex min-h-[68px] items-center justify-between gap-4 xl:h-[82px]">
            {/* Desktop Nav */}
            <nav className="hidden items-center gap-8 text-sm font-extrabold uppercase tracking-wide xl:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap text-white transition hover:text-green-100 dark:hover:text-green-300"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Logo */}
            <Link
              href="/"
              className="shrink-0 xl:absolute xl:left-1/2 xl:-translate-x-1/2"
            >
              <Image
                src="/images/newstokoslogo.png"
                alt="Stoko's Logo"
                width={170}
                height={70}
                priority
                className="h-9 w-auto object-contain sm:h-10 md:h-12"
              />
            </Link>

            {/* Right Actions – Desktop only */}
            <div className="ml-auto hidden items-center gap-3 xl:flex">
              <DesktopAuthControls />

              <a
                href="/mainwebsite/location?action=order"
                className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#16A34A] transition hover:bg-green-50 dark:bg-white dark:text-[#003b11] md:px-6 md:py-3 md:text-sm"
              >
                Order Online
              </a>

              {/* Theme Toggle */}
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            </div>

            {/* Mobile/Tablet Right Actions */}
            <div className="ml-auto flex items-center gap-2 xl:hidden">
              {/* Sign In – prominent on mobile */}
              <MobileSignInButton />

              <button
                type="button"
                id="mobile-menu-toggle"
                aria-label="Toggle menu"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white transition hover:bg-white/25 active:scale-95"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {/* Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Slide-down panel */}
      <div
        className={`fixed left-0 right-0 top-0 z-50 xl:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-4 mt-4 overflow-hidden rounded-2xl bg-[#16A34A] shadow-2xl dark:bg-[#003b11]">
          {/* Drawer header */}
          <div className="flex items-center justify-between border-b border-white/20 px-5 py-4">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Image
                src="/images/newstokoslogo.png"
                alt="Stoko's Logo"
                width={140}
                height={56}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1 px-4 pt-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-white/15"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA + Auth + Theme */}
          <div className="flex flex-col gap-3 px-4 pb-5 pt-4">
            <a
              href="/mainwebsite/location?action=order"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center rounded-full bg-white py-3 text-sm font-black text-[#16A34A] transition hover:bg-green-50"
            >
              Order Online
            </a>

            {/* Auth buttons stacked */}
            <MobileAuthControls onClose={() => setMobileMenuOpen(false)} />

            {/* Theme toggle inside hamburger */}
            <button
              type="button"
              onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/15 py-3 text-sm font-black uppercase text-white transition hover:bg-white/25"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function ThemeToggle({
  isDark,
  onToggle,
  compact = false,
}: {
  isDark: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle dark mode"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white transition hover:bg-white/25"
      >
        {isDark ? <Moon size={15} /> : <Sun size={15} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle dark mode"
      className="relative flex h-9 w-[70px] cursor-pointer items-center rounded-full border border-white/30 bg-white/20 p-1 transition dark:bg-white/10"
    >
      <span
        className={`absolute flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#16A34A] shadow-md transition-all duration-300 ${
          isDark ? "translate-x-[34px]" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon size={14} className="text-black" />
        ) : (
          <Sun size={14} className="text-green-800" />
        )}
      </span>
      <span className="flex w-full items-center justify-between px-2 text-white">
        <Sun size={13} />
        <Moon size={13} />
      </span>
    </button>
  );
}

function DesktopAuthControls() {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-white/25"
          >
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-[#16A34A] transition hover:bg-green-50"
          >
            Sign Up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link
          href="/account"
          className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-black uppercase text-white"
        >
          Account
        </Link>
        <UserButton
          appearance={{
            elements: { avatarBox: "h-9 w-9" },
          }}
        />
      </Show>
    </div>
  );
}

function MobileSignInButton() {
  return (
    <Show when="signed-out">
      <SignInButton mode="modal">
        <button
          type="button"
          className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-[#16A34A] shadow-sm transition hover:bg-green-50"
        >
          Sign In
        </button>
      </SignInButton>
    </Show>
  );
}

function MobileAuthControls({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Show when="signed-out">
        <div className="grid grid-cols-2 gap-2">
          <SignInButton mode="modal">
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-full border border-white/40 bg-white/15 py-3 text-sm font-black uppercase text-white transition hover:bg-white/25"
            >
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-full bg-white/90 py-3 text-sm font-black uppercase text-[#16A34A] transition hover:bg-white"
            >
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            onClick={onClose}
            className="flex flex-1 items-center justify-center rounded-full border border-white/40 bg-white/15 py-3 text-sm font-black uppercase text-white"
          >
            Account
          </Link>
          <UserButton
            appearance={{
              elements: { avatarBox: "h-10 w-10" },
            }}
          />
        </div>
      </Show>
    </>
  );
}