"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 500);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`
        fixed bottom-6 right-5 z-[9999]
        flex h-12 w-12 items-center justify-center rounded-full
        border border-black/10 bg-[#16A34A] text-white
        shadow-[0_18px_45px_rgba(22,163,74,0.35)]
        transition-all duration-300
        hover:-translate-y-1 hover:bg-[#12863d]
        dark:border-white/10 dark:bg-[#16A34A]
        dark:shadow-[0_18px_45px_rgba(0,0,0,0.45)]
        sm:bottom-8 sm:right-8 sm:h-14 sm:w-14
        ${
          show
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-5 opacity-0"
        }
      `}
    >
      <ArrowUp size={22} strokeWidth={3} />
    </button>
  );
}