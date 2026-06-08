"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={scrollTop}
    className="fixed bottom-[92px] right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-2xl transition hover:scale-105 active:scale-95 md:bottom-[100px] md:h-16 md:w-16"
      aria-label="Back to top"
    >
      <ArrowUp size={24} />
    </button>
  );
}