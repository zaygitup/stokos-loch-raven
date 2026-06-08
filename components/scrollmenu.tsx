"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const CATEGORY_ID_MAP: Record<string, string> = {
  pizza: "pizzas",
  pizzas: "pizzas",
  breakfast: "breakfast",
  wings: "wings",
  subs: "subs",
  sandwiches: "sandwiches",
  sides: "sides",
  trending: "trending",
};

export default function ScrollMenu() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get("category");

    if (!category) return;

    const targetId =
      CATEGORY_ID_MAP[category.toLowerCase()] || category.toLowerCase();

    let attempts = 0;

    const scrollToSection = () => {
      attempts += 1;

      const section = document.getElementById(targetId);

      if (section) {
        const navbarOffset = 120;

        const top =
          section.getBoundingClientRect().top + window.scrollY - navbarOffset;

        window.scrollTo({
          top,
          behavior: "smooth",
        });

        return;
      }

      if (attempts < 30) {
        window.setTimeout(scrollToSection, 150);
      }
    };

    const timer = window.setTimeout(scrollToSection, 700);

    return () => window.clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}