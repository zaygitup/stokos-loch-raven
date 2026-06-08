"use client";

import { useRef, useState } from "react";
import type { MouseEvent } from "react";

const CATEGORIES = [
  { id: "trending", name: "Popular Menu Items", special: true },
  { id: "breakfast", name: "Breakfast (served until 11am)" },
  { id: "deals", name: "Menu Coupons" },
  { id: "salads", name: "Fresh Salads" },
  { id: "hot-subs", name: "Hot Subs" },
  { id: "cold-subs", name: "Cold Sub" },
  { id: "seafood-subs", name: "Seafood Subs" },
  { id: "sandwiches", name: "Sandwiches" },
  { id: "club-sandwiches", name: "Club Sandwiches" },
  { id: "pizzas", name: "Pizzas" },
  { id: "specialty-pizzas", name: "Stoko's Specialty Pizzas" },
  { id: "stromboli", name: "Famous Stromboli" },
  { id: "calzones", name: "Calzones" },
  { id: "quesadillas", name: "Quesadillas" },
  { id: "platters", name: "Platters" },
  { id: "chicken", name: "Chicken" },
  { id: "fish-special", name: "Fish Special" },
  { id: "fish-only", name: "Fish Only" },
  { id: "pasta", name: "Italian Pasta" },
  { id: "gyros", name: "Gyros" },
  { id: "pick-2", name: "Pick 2" },
  { id: "wrapped", name: "Get Wrapped" },
  { id: "sides", name: "Side Orders" },
  { id: "dessert", name: "Dessert" },
  { id: "beverages", name: "Beverages" },
];

export default function Categories() {
  const [active, setActive] = useState("trending");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (
    id: string,
    e: MouseEvent<HTMLButtonElement>
  ) => {
    setActive(id);

    const target = e.currentTarget;
    const container = scrollRef.current;

    if (container) {
      const scrollPos =
        target.offsetLeft -
        container.clientWidth / 2 +
        target.clientWidth / 2;

      const maxScroll = container.scrollWidth - container.clientWidth;

      container.scrollTo({
        left: Math.max(0, Math.min(scrollPos, maxScroll)),
        behavior: "smooth",
      });
    }

    const section = document.getElementById(id);

    if (section) {
      const yOffset = -150;
      const y =
        section.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="top-[125px] z-30 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-black/95 md:top-[82px]">
      <div className="mx-auto w-full max-w-[1600px]">
        <div
          ref={scrollRef}
          className="
            no-scrollbar flex w-full flex-nowrap items-center gap-2.5
            overflow-x-auto scroll-smooth px-4 py-4
            sm:px-5
            md:gap-3 md:px-6
            lg:px-3
            xl:px-10
            2xl:px-0
          "
        >
          {CATEGORIES.map((cat) => {
            const isActive = active === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={(e) => handleCategoryClick(cat.id, e)}
                className={`
                  relative flex-shrink-0 whitespace-nowrap rounded-full
                  px-5 py-2 text-[12px] font-semibold leading-none
                  outline-none transition-all duration-200
                  sm:px-6 sm:py-2.5 sm:text-[13px]
                  md:px-7 md:text-sm
                  lg:px-8
                  ${
                    isActive
                      ? "bg-[#DA3327] text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }
                `}
              >
                {cat.name}
              </button>
            );
          })}

          <div className="h-1 w-4 flex-shrink-0 md:w-6" />
        </div>
      </div>
    </div>
  );
}