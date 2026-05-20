"use client";

import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

// Dynamically loaded — Leaflet requires browser globals
export function DraggablePinMap({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markerRef    = useRef<any>(null);

  useEffect(() => {
    let active = true;
    if (!containerRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!active || !containerRef.current || (containerRef.current as any)._leaflet_id) return;

      // Fix default marker icon path broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, { zoomControl: true }).setView([lat, lng], 17);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.bindPopup("Drag me to your exact location").openPopup();

      marker.on("dragend", () => {
        const { lat: la, lng: lo } = marker.getLatLng();
        onChange(la, lo);
      });

      // Also allow clicking the map to reposition
      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        onChange(e.latlng.lat, e.latlng.lng);
      });

      if (active) {
        mapRef.current    = map;
        markerRef.current = marker;
      } else {
        map.remove();
      }
    })();

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current    = null;
      }
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep marker in sync when lat/lng changes externally (e.g. after re-geocode)
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [lat, lng]);

  return <div ref={containerRef} style={{ height: 260, width: "100%" }} />;
}
