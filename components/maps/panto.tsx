"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

// Pans the parent <Map> whenever `target` changes (e.g. after a search pick).
// Rendered as a child of <Map> so it can access the map via context.
export default function PanTo({
  target,
}: {
  target: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (map && target) map.panTo(target);
  }, [map, target]);
  return null;
}
