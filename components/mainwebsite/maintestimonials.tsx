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

export default function MainTestimonials() {
  return (
    <section
      id="testimonials"
      className="w-full bg-[#f7faf6] px-4 py-16 text-black transition-colors duration-300 dark:bg-[#07110a] dark:text-white sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        {/* Header */}
        <div className="mb-9 md:mb-8 lg:mb-9">
          <p className="mb-3 text-[12px] font-black uppercase tracking-[0.35em] text-[#ff3131] md:text-[11px] lg:text-[12px]">
            What Guests Say
          </p>

          <h2 className="text-[34px] font-black leading-tight tracking-[-0.04em] text-black dark:text-white md:text-[38px] lg:text-[44px]">
            Reviews from real customers
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4 lg:gap-6">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="rounded-[20px] bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)] dark:bg-[#121b13] dark:ring-white/5 dark:shadow-[0_14px_35px_rgba(0,0,0,0.28)] md:p-4 lg:p-8"
            >
              {/* Stars */}
              <div className="mb-5 flex items-center gap-1.5 text-[#ff3131] md:mb-4 md:gap-1 lg:mb-5 lg:gap-1.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={17}
                    fill="currentColor"
                    strokeWidth={2.5}
                    className="md:h-[14px] md:w-[14px] lg:h-[17px] lg:w-[17px]"
                  />
                ))}
              </div>

              {/* Review */}
              <p className="min-h-[98px] text-[16px] font-medium leading-[1.6] text-neutral-700 dark:text-neutral-300 md:min-h-[150px] md:text-[12px] md:leading-[1.55] lg:min-h-[130px] lg:text-[16px] lg:leading-[1.6]">
                “{item.text}”
              </p>

              {/* Customer */}
              <div className="mt-7 flex items-center gap-4 md:mt-5 md:gap-3 lg:mt-7 lg:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#ff3131] dark:bg-white/5 md:h-9 md:w-9 lg:h-11 lg:w-11">
                  <Star
                    size={17}
                    fill="currentColor"
                    strokeWidth={2.5}
                    className="md:h-[14px] md:w-[14px] lg:h-[17px] lg:w-[17px]"
                  />
                </div>

                <div>
                  <h3 className="text-[15px] font-black leading-tight text-black dark:text-white md:text-[13px] lg:text-[15px]">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-[13px] font-medium leading-none text-black/60 dark:text-white/65 md:text-[11px] lg:text-[13px]">
                    Verified order
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}