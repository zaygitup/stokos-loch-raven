"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Mirrors HomePageFeaturedDeal from lib/server/menuproducts.ts. Declared
// locally so this client component never imports the server-only module.
type FeaturedDeal = {
  id: string;
  productSlug: string;
  title: string;
  description: string;
  price: string;
  image: string;
  storeSlug: string;
  storeName: string;
  sortOrder: number;
};

function DealCard({
  deal,
  wrapperClassName = "",
}: {
  deal: FeaturedDeal;
  wrapperClassName?: string;
}) {
  return (
    <article
      className={`group overflow-hidden rounded-[20px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)] dark:bg-[#121b13] dark:ring-white/10 dark:shadow-[0_12px_35px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_18px_50px_rgba(0,0,0,0.45)] ${wrapperClassName}`}
    >
      <div className="relative h-[225px] w-full overflow-hidden bg-neutral-100 dark:bg-[#050505] md:h-[200px] lg:h-[225px]">
        <img
          src={deal.image}
          alt={deal.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute left-4 top-4 rounded-full bg-[#ff3131] px-4 py-2 text-[12px] font-black uppercase tracking-wide text-white shadow-[0_8px_18px_rgba(255,49,49,0.25)]">
          Deal
        </div>

        <div className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white backdrop-blur-sm">
          {deal.storeName}
        </div>

        <div className="pointer-events-none absolute inset-0 hidden bg-black/5 dark:block" />
      </div>

      <div className="p-6">
        <h3 className="text-[22px] font-black leading-tight tracking-[-0.03em] text-black transition-colors duration-300 dark:text-white">
          {deal.title}
        </h3>

        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#ff3131]">
          {deal.storeName}
        </p>

        <p className="mt-3 min-h-[52px] text-[14px] font-medium leading-[1.55] text-neutral-700 transition-colors duration-300 dark:text-neutral-300">
          {deal.description}
        </p>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-[26px] font-black leading-none tracking-[-0.04em] text-[#ff3131]">
            {deal.price}
          </p>

          <Link
            href={`/store/${deal.storeSlug}?product=${encodeURIComponent(
              deal.productSlug
            )}`}
            className="inline-flex h-[42px] items-center justify-center rounded-full bg-[#ff3131] px-6 text-[12px] font-black uppercase tracking-wide text-white shadow-[0_10px_25px_rgba(255,49,49,0.22)] transition hover:bg-[#e92828] dark:shadow-[0_10px_28px_rgba(255,49,49,0.28)]"
          >
            Order Deal
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function FeaturedDealsCarousel({
  deals,
}: {
  deals: FeaturedDeal[];
}) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const useSlider = deals.length > 3;

  const scroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;

    const scrollAmount = sliderRef.current.clientWidth * 0.85;

    sliderRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full bg-white px-4 py-14 transition-colors duration-300 dark:bg-black sm:px-5 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-[12px] font-black uppercase tracking-[0.35em] text-[#ff3131]">
              This Week&apos;s Offers
            </p>

            <h2 className="text-[34px] font-black leading-none tracking-[-0.04em] text-black transition-colors duration-300 dark:text-white md:text-[38px] lg:text-[42px]">
              Featured Deals
            </h2>

            <p className="mt-3 text-[13px] font-bold uppercase tracking-[0.12em] text-neutral-600 dark:text-neutral-400">
              Prices may vary by location
            </p>
          </div>

          {useSlider ? (
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="Previous deals"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-black transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="Next deals"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-black transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : null}
        </div>

        {useSlider ? (
          <div
            ref={sliderRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-4 scroll-smooth pb-3"
          >
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                wrapperClassName="w-[84vw] shrink-0 snap-start sm:w-[380px] lg:w-[calc((100%-3rem)/3)]"
              />
            ))}

            <div className="h-1 w-1 shrink-0" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4 lg:gap-6">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
