import Image from "next/image";
import Link from "next/link";
import { getHomePageCategories } from "@/lib/server/menucategories";

export default async function ExploreMenuSection() {
  const categories = await getHomePageCategories();

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full overflow-hidden bg-[#e0e7e1] px-4 py-16 transition-colors duration-300 dark:bg-[#1b241d] md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1245px]">
        {/* Header */}
        <div className="mb-9">
          <p className="mb-3 text-[12px] font-black uppercase tracking-[0.35em] text-[#ff3131]">
            Made Fresh Daily
          </p>

          <h2 className="text-[34px] font-black leading-none tracking-[-0.04em] text-black dark:text-white md:text-[40px]">
            Explore Our Menu
          </h2>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-6 lg:gap-4 xl:gap-6">
          {categories.map((item) => (
            <Link
              key={item.id}
              href={`/mainwebsite/location?action=menu&category=${item.slug}`}
              className="group flex h-[205px] min-w-0 flex-col items-center justify-center rounded-[18px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)] dark:bg-[#101a12] dark:ring-white/5 dark:shadow-[0_12px_30px_rgba(0,0,0,0.28)] dark:hover:shadow-[0_18px_45px_rgba(0,0,0,0.38)] sm:h-[215px] lg:h-[205px] xl:h-[222px]"
            >
              <div className="relative h-[128px] w-[128px] overflow-hidden rounded-full bg-white p-1 shadow-inner dark:bg-[#18241a] sm:h-[138px] sm:w-[138px] lg:h-[112px] lg:w-[112px] xl:h-[138px] xl:w-[138px] 2xl:h-[150px] 2xl:w-[150px]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full rounded-full object-cover transition duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-400 dark:bg-neutral-800">
                    IMG
                  </div>
                )}
              </div>

              <h3 className="mt-5 text-center text-[13px] font-black uppercase tracking-wide text-black transition-colors duration-300 dark:text-white xl:text-[15px]">
                {item.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}