import { Suspense } from "react";
import LocationStoreCards from "@/components/mainwebsite/mainlocationcard";
// or your actual import path:
// import LocationStoreCards from "@/components/LocationStoreCards";

function LocationPageFallback() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-[#07110a] dark:text-white">
      <p className="text-sm font-bold uppercase tracking-wide">
        Loading locations...
      </p>
    </section>
  );
}

export default function LocationPage() {
  return (
    <Suspense fallback={<LocationPageFallback />}>
      <LocationStoreCards />
    </Suspense>
  );
}