"use client";

import { useState } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { AlertTriangle } from "lucide-react";
import MapCircle from "@/components/maps/mapcircle";
import MapSearchBox, { type PlaceResult } from "@/components/maps/mapsearchbox";
import PanTo from "@/components/maps/panto";

// Fallback center (Towson, MD) used when a branch has no pin set yet.
const DEFAULT_CENTER = { lat: 39.4015, lng: -76.5719 };

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function PickerInner({
  lat,
  lng,
  radiusKm,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const hasPin = lat != null && lng != null;
  const center = hasPin ? { lat: lat!, lng: lng! } : DEFAULT_CENTER;
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const handlePlace = (place: PlaceResult) => {
    onChange(place.lat, place.lng);
    setPanTarget({ lat: place.lat, lng: place.lng });
  };

  const handleMapClick = (e: { detail: { latLng: { lat: number; lng: number } | null } }) => {
    const ll = e.detail.latLng;
    if (ll) onChange(ll.lat, ll.lng);
  };

  return (
    <div className="space-y-3">
      <MapSearchBox onPlace={handlePlace} placeholder="Search this branch's address..." />

      <div className="h-72 w-full overflow-hidden rounded-2xl border border-zinc-200">
        <Map
          defaultCenter={center}
          defaultZoom={hasPin ? 13 : 11}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
          onClick={handleMapClick}
          style={{ width: "100%", height: "100%" }}
        >
          {hasPin && (
            <>
              <Marker
                position={{ lat: lat!, lng: lng! }}
                draggable
                onDragEnd={(e) => {
                  const ll = e.latLng;
                  if (ll) onChange(ll.lat(), ll.lng());
                }}
              />
              <MapCircle center={{ lat: lat!, lng: lng! }} radiusKm={radiusKm} />
            </>
          )}
          <PanTo target={panTarget} />
        </Map>
      </div>

      <p className="text-xs font-medium text-zinc-500">
        {hasPin
          ? "Drag the pin or search to reposition the branch. The shaded circle is the delivery radius."
          : "Search an address or click the map to drop the branch pin."}
      </p>
    </div>
  );
}

export default function BranchMapPicker(props: {
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  onChange: (lat: number, lng: number) => void;
}) {
  if (!MAPS_KEY) {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>
          Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map
          picker. You can still enter coordinates manually below.
        </span>
      </div>
    );
  }

  return (
    <APIProvider apiKey={MAPS_KEY}>
      <PickerInner {...props} />
    </APIProvider>
  );
}
