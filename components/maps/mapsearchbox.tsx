"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search } from "lucide-react";

export type PlaceResult = {
  lat: number;
  lng: number;
  address: string;
};

// A text input wired to the Google Places Autocomplete. When the user picks a
// suggestion we resolve its coordinates + formatted address and hand them up.
export default function MapSearchBox({
  onPlace,
  placeholder = "Search for an address...",
}: {
  onPlace: (place: PlaceResult) => void;
  placeholder?: string;
}) {
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onPlaceRef = useRef(onPlace);

  useEffect(() => {
    onPlaceRef.current = onPlace;
  }, [onPlace]);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ["geometry", "formatted_address", "name"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;

      onPlaceRef.current({
        lat: loc.lat(),
        lng: loc.lng(),
        address: place.formatted_address || place.name || "",
      });
    });

    return () => listener.remove();
  }, [placesLib]);

  return (
    <div className="relative">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-green-600"
      />
    </div>
  );
}
