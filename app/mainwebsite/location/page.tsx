import type { Metadata } from "next";
import { Suspense } from "react";
import LocationStoreCards from "@/components/mainwebsite/mainlocationcard";

export const metadata: Metadata = {
  title: "Choose Location | Stokos",
  description: "Choose your nearest Stokos location to view the menu and place your order.",
  alternates: {
    canonical: "https://stokos-loch-raven.vercel.app/mainwebsite/location",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function LocationPageFallback() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-[#07110a] dark:text-white">
      <p className="text-sm font-bold uppercase tracking-wide">
        Loading locations...
      </p>
    </section>
  );
}

import { getStoresForCategory } from "@/lib/server/menucategories";

export default async function LocationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = params.category as string | undefined;
  const availableStoreSlugs = category ? await getStoresForCategory(category) : null;

  return (
    <Suspense fallback={<LocationPageFallback />}>
      <LocationStoreCards availableStoreSlugs={availableStoreSlugs} />
    </Suspense>
  );
}