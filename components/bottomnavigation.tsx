"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, MapPin, User, Moon, Sun, AlignJustify, X } from "lucide-react";
import { STORES } from "@/lib/data/stores";

export default function BottomNavigation() {
  const pathname = usePathname();

  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const storeSlug = pathname.match(/^\/store\/([^/]+)/)?.[1];
  const currentStore = STORES.find((store) => store.slug === storeSlug) || STORES[0];
  const storeBasePath = `/store/${currentStore.slug}`;
  const storeContactPath = `/store/${currentStore.slug}/contact`;

  const isStorePage = pathname.startsWith("/store/");
  const isHomePage = pathname === "/";
  const showNav = isStorePage || isHomePage;

  useEffect(() => {
    // Support both theme keys used across the app
    const savedTheme = localStorage.getItem("theme") || localStorage.getItem("main_theme");
    if (savedTheme === "dark") {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  }, []);

  // Return after all hooks
  if (!showNav) return null;

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !isDark;
    const themeKey = isHomePage ? "main_theme" : "theme";

    if (nextDark) {
      root.classList.add("dark");
      localStorage.setItem(themeKey, "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem(themeKey, "light");
    }

    setIsDark(nextDark);
  };

  const navItem = (icon: React.ReactNode, label: string, href: string, isActive: boolean) => (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-tight ${
        isActive
          ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
          : "text-zinc-600 dark:text-zinc-500 hover:text-green-600 dark:hover:text-green-400"
      }`}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </Link>
  );

  const isHome = pathname === "/";
  const isMenu = pathname === storeBasePath;
  const isContact = pathname === storeContactPath;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-20 items-center justify-between gap-0 border-t border-zinc-200 bg-white px-1 py-2 dark:border-zinc-800 dark:bg-black md:hidden">
        {navItem(<Home size={20} />, "Home", "/", isHome)}
        {navItem(<Menu size={20} />, "Menu", `${storeBasePath}#trending`, isMenu)}
        {navItem(<MapPin size={20} />, "Location", storeContactPath, isContact)}
        {navItem(<User size={20} />, "Account", "/account", pathname === "/account")}

        {/* More Button – only on store pages */}
        {isStorePage && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-500 hover:text-green-600 dark:hover:text-green-400"
          >
            {menuOpen ? <X size={20} /> : <AlignJustify size={20} />}
            <span className="leading-none">More</span>
          </button>
        )}
      </nav>

      {/* Backdrop for menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed bottom-20 left-0 right-0 z-40 bg-white dark:bg-[#111] border-t border-zinc-200 dark:border-zinc-800 transition-all duration-300 md:hidden overflow-hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-1 p-4">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-black uppercase text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <Link
            href={storeContactPath}
            onClick={() => setMenuOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-black uppercase text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <span>Contact Us</span>
          </Link>

          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-black uppercase text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-20 md:hidden" />
    </>
  );
}
