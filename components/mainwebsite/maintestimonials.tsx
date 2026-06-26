"use client";

import { useRef, useState } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Urs M.",
    text: "This place is a godsend. Got off of work at 12:30 a.m. and I was STARVING and so were my co-workers. Stoko's was just what we needed. The food is spectacular.",
  },
  {
    name: "Khoi N.",
    text: "This place does not disappoint. It's a great spot for wings, gyros, fries and cheese steaks. Food is inexpensive and they pack a lot of food in your containers.",
  },
  {
    name: "Zakiyyah M.",
    text: "Stoko's will always be one of my favorite wing spots to order from. The food is always fresh and served pretty quick. The chicken box is always on point.",
  },
];

function ReviewCard({ item }: { item: (typeof testimonials)[0] }) {
  return (
    <article className="flex h-full flex-col rounded-[20px] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5 dark:bg-[#121b13] dark:ring-white/5 dark:shadow-[0_14px_35px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex items-center gap-1 text-[#ff3131]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={15} fill="currentColor" strokeWidth={0} />
        ))}
      </div>

      <p className="flex-1 text-[14px] font-medium leading-[1.6] text-neutral-700 dark:text-neutral-300">
        "{item.text}"
      </p>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#ff3131] dark:bg-white/5">
          <Star size={14} fill="currentColor" strokeWidth={0} />
        </div>
        <div>
          <h3 className="text-[13px] font-black text-black dark:text-white">{item.name}</h3>
          <p className="text-[11px] font-medium text-black/50 dark:text-white/50">Verified order</p>
        </div>
      </div>
    </article>
  );
}

export default function MainTestimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / testimonials.length;
    setActiveIndex(Math.round(el.scrollLeft / cardWidth));
  };

  return (
    <section
      id="testimonials"
      className="w-full bg-[#f7faf6] px-4 py-12 text-black transition-colors duration-300 dark:bg-[#07110a] dark:text-white sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="mb-7 md:mb-8">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.35em] text-[#ff3131]">
            What Guests Say
          </p>
          <h2 className="text-[28px] font-black leading-tight tracking-[-0.04em] text-black dark:text-white sm:text-[34px] md:text-[38px] lg:text-[44px]">
            Reviews from real customers
          </h2>
        </div>

        {/* Mobile: horizontal swipe carousel */}
        <div className="md:hidden">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 no-scrollbar"
          >
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="w-[82vw] max-w-[320px] flex-shrink-0 snap-start"
              >
                <ReviewCard item={item} />
              </div>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="mt-4 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <span
                key={i}
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-5 bg-[#ff3131]"
                    : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: 3-column grid */}
        <div className="hidden gap-4 md:grid md:grid-cols-3 lg:gap-6">
          {testimonials.map((item) => (
            <ReviewCard key={item.name} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
