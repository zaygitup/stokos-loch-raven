"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ToggleDark() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 1. When component mounts, check the actual class on the HTML element
  useEffect(() => {
    setMounted(true);
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    setIsDark(isCurrentlyDark);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  // Prevent rendering the icon until the client side is ready
  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-10 left-5 lg:left-24 w-12 h-12 rounded-full z-[100]
                 bg-zinc-100 text-black border border-zinc-300
                 dark:bg-zinc-800 dark:text-white dark:border-zinc-700
                 flex items-center justify-center shadow-2xl 
                 hover:scale-110 active:scale-95 transition-all duration-300"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-zinc-600" />
      )}
    </button>
  );
}