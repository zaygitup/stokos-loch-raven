"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

// Renders a google.maps.Circle overlay on the parent <Map>. @vis.gl does not
// ship a Circle component, so we manage the native overlay imperatively.
export default function MapCircle({
  center,
  radiusKm,
  strokeColor = "#14743A",
  fillColor = "#14743A",
}: {
  center: { lat: number; lng: number };
  radiusKm: number;
  strokeColor?: string;
  fillColor?: string;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        strokeColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor,
        fillOpacity: 0.12,
        clickable: false,
      });
    }

    const circle = circleRef.current;
    circle.setMap(map);
    circle.setCenter(center);
    circle.setRadius(Math.max(0, radiusKm) * 1000);

    return () => {
      circle.setMap(null);
    };
  }, [map, center, radiusKm, strokeColor, fillColor]);

  return null;
}
