"use client";

import { useEffect, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import MapCircle from "@/components/maps/mapcircle";
import MapSearchBox, { type PlaceResult } from "@/components/maps/mapsearchbox";
import PanTo from "@/components/maps/panto";
import { isWithinRadius } from "@/lib/geo";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export type DeliverySelection = {
  address: string;
  lat: number;
  lng: number;
  withinRadius: boolean;
};

function PickerInner({
  branchLat,
  branchLng,
  radiusKm,
  initial,
  onSelect,
}: {
  branchLat: number;
  branchLng: number;
  radiusKm: number;
  initial: { lat: number; lng: number; address: string } | null;
  onSelect: (selection: DeliverySelection) => void;
}) {
  const branch = { lat: branchLat, lng: branchLng };
  const geocodingLib = useMapsLibrary("geocoding");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [address, setAddress] = useState(initial?.address ?? "");
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(
    null
  );

  useEffect(() => {
    if (geocodingLib && !geocoderRef.current) {
      geocoderRef.current = new geocodingLib.Geocoder();
    }
  }, [geocodingLib]);

  const within = point ? isWithinRadius(branch, point, radiusKm) : false;

  const emit = (
    next: { lat: number; lng: number },
    nextAddress: string
  ) => {
    onSelect({
      lat: next.lat,
      lng: next.lng,
      address: nextAddress,
      withinRadius: isWithinRadius(branch, next, radiusKm),
    });
  };

  const handlePlace = (place: PlaceResult) => {
    const next = { lat: place.lat, lng: place.lng };
    setPoint(next);
    setAddress(place.address);
    setPanTarget(next);
    emit(next, place.address);
  };

  // Used by both marker-drag and map-click. Reverse-geocodes so the stored
  // address matches the dropped pin.
  const setPointFromMap = (next: { lat: number; lng: number }) => {
    setPoint(next);

    const fallback = `${next.lat.toFixed(5)}, ${next.lng.toFixed(5)}`;

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: next }, (results, status) => {
        const formatted =
          status === "OK" && results?.[0]?.formatted_address
            ? results[0].formatted_address
            : fallback;
        setAddress(formatted);
        emit(next, formatted);
      });
    } else {
      setAddress(fallback);
      emit(next, fallback);
    }
  };

  return (
    <div className="space-y-3">
      <MapSearchBox
        onPlace={handlePlace}
        placeholder="Search your delivery address..."
      />

      <div className="h-64 w-full overflow-hidden rounded-xl border border-zinc-200">
        <Map
          defaultCenter={point ?? branch}
          defaultZoom={13}
          gestureHandling="greedy"
          clickableIcons={false}
          onClick={(e) => {
            const ll = e.detail.latLng;
            if (ll) setPointFromMap({ lat: ll.lat, lng: ll.lng });
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <MapCircle center={branch} radiusKm={radiusKm} />
          {point && (
            <Marker
              position={point}
              draggable
              onDragEnd={(e) => {
                const ll = e.latLng;
                if (ll) setPointFromMap({ lat: ll.lat(), lng: ll.lng() });
              }}
            />
          )}
          <PanTo target={panTarget} />
        </Map>
      </div>

      {point ? (
        within ? (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 p-2 text-xs font-semibold text-green-700">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
            <span>{address || "Location selected"} — within delivery area.</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-[#DA3327]">
            <XCircle size={15} className="mt-0.5 shrink-0" />
            <span>Outside delivery area. Choose a closer address.</span>
          </div>
        )
      ) : (
        <p className="text-xs font-medium text-zinc-500">
          Search an address or tap the map to set your delivery location.
        </p>
      )}
    </div>
  );
}

export default function DeliveryMapPicker(props: {
  branchLat: number;
  branchLng: number;
  radiusKm: number;
  initial: { lat: number; lng: number; address: string } | null;
  onSelect: (selection: DeliverySelection) => void;
}) {
  if (!MAPS_KEY) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>Delivery map is unavailable. Please contact the store to order delivery.</span>
      </div>
    );
  }

  return (
    <APIProvider apiKey={MAPS_KEY}>
      <PickerInner {...props} />
    </APIProvider>
  );
}
