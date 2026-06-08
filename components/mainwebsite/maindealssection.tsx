import Image from "next/image";
import Link from "next/link";

const deals = [
  {
    title: "Half Sub Combo",
    slug: "half-sub-fries-soda-special",
    description:
      "Any 1/2 sub with French fries and a can of soda. Seafood subs extra.",
    price: "$12.99",
    image: "/images/halfsubcombo.jpeg",
  },
  {
    title: "2 Large 1-Topping Pizzas",
    slug: "two-large-one-topping-pizzas",
    description: "Two large pizzas with one topping each.",
    price: "$18.99",
    image: "/images/largepizza.png",
  },
  {
    title: "XL Pizza & 20 Wings",
    slug: "xl-pizza-one-topping-20-wings",
    description: "X-large 1-topping pizza with 20 Buffalo wings.",
    price: "$29.99",
    image: "/images/pizzaandwings.png",
  },
];

export default function FeaturedDeals() {
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
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4 lg:gap-6">
          {deals.map((deal) => (
            <article
              key={deal.slug}
              className="group overflow-hidden rounded-[20px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)] dark:bg-[#121b13] dark:ring-white/10 dark:shadow-[0_12px_35px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
            >
              <div className="relative h-[225px] w-full overflow-hidden bg-neutral-100 dark:bg-[#050505] md:h-[155px] lg:h-[225px]">
                <Image
                  src={deal.image}
                  alt={deal.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute left-4 top-4 rounded-full bg-[#ff3131] px-4 py-2 text-[12px] font-black uppercase tracking-wide text-white shadow-[0_8px_18px_rgba(255,49,49,0.25)] md:left-3 md:top-3 md:px-3 md:py-1.5 md:text-[10px] lg:left-4 lg:top-4 lg:px-4 lg:py-2 lg:text-[12px]">
                  Deal
                </div>

                <div className="pointer-events-none absolute inset-0 hidden bg-black/5 dark:block" />
              </div>

              <div className="p-6 md:p-4 lg:p-6">
                <h3 className="text-[22px] font-black leading-tight tracking-[-0.03em] text-black transition-colors duration-300 dark:text-white md:min-h-[44px] md:text-[18px] lg:min-h-0 lg:text-[22px]">
                  {deal.title}
                </h3>

                <p className="mt-3 min-h-[52px] text-[14px] font-medium leading-[1.55] text-neutral-700 transition-colors duration-300 dark:text-neutral-300 md:min-h-[68px] md:text-[12px] lg:min-h-[52px] lg:text-[14px]">
                  {deal.description}
                </p>

                <div className="mt-6 flex items-center justify-between gap-4 md:mt-5 md:flex-col md:items-start md:gap-3 lg:mt-6 lg:flex-row lg:items-center lg:gap-4">
                  <p className="text-[26px] font-black leading-none tracking-[-0.04em] text-[#ff3131] md:text-[23px] lg:text-[26px]">
                    {deal.price}
                  </p>

                  <Link
                    href={`/mainwebsite/location?action=deal&deal=${deal.slug}`}
                    className="inline-flex h-[42px] items-center justify-center rounded-full bg-[#ff3131] px-6 text-[12px] font-black uppercase tracking-wide text-white shadow-[0_10px_25px_rgba(255,49,49,0.22)] transition hover:bg-[#e92828] dark:shadow-[0_10px_28px_rgba(255,49,49,0.28)] md:h-[38px] md:w-full md:px-4 md:text-[11px] lg:h-[42px] lg:w-auto lg:px-6 lg:text-[12px]"
                  >
                    Order Deal
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}