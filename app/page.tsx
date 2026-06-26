import { Suspense } from "react";

import MainNavbar from "@/components/mainwebsite/mainnavbar";
import MainHeroSection from "@/components/mainwebsite/mainherosection";
import MainStoreSelection from "@/components/mainwebsite/mainstoreselection";
import MainTestimonials from "@/components/mainwebsite/maintestimonials";
import MainFooter from "@/components/mainwebsite/mainfooter";
import BackToTop from "@/components/mainwebsite/mainbacktotop";
import FeaturedDeals from "@/components/mainwebsite/maindealssection";
import ExploreMenuSection from "@/components/mainwebsite/mainmenusection";
import BottomNavigation from "@/components/bottomnavigation";

function StoreSelectionFallback() {
  return (
    <section
      id="stores"
      className="w-full bg-white px-4 py-16 text-black dark:bg-black dark:text-white"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <p className="text-sm font-bold uppercase tracking-wide">
          Loading stores...
        </p>
      </div>
    </section>
  );
}

import { getStoresForCategory } from "@/lib/server/menucategories";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = params.category as string | undefined;
  const availableStoreSlugs = category ? await getStoresForCategory(category) : null;

  return (
    <>
      <MainNavbar />

      <main className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-black dark:text-white">
        <MainHeroSection />

        <FeaturedDeals />

        <ExploreMenuSection />

        <Suspense fallback={<StoreSelectionFallback />}>
          <section id="stores">
            <MainStoreSelection availableStoreSlugs={availableStoreSlugs} />
          </section>
        </Suspense>

        <section id="testimonials">
          <MainTestimonials />
        </section>

        <BackToTop />

        <MainFooter />
      </main>

      <BottomNavigation />
    </>
  );
}