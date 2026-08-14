"use client";

import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window { google?: typeof google; }
}

type MapViewProps = {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
};

let mapScriptPromise: Promise<void> | null = null;

function loadMapScript() {
  if (window.google?.maps) return Promise.resolve();
  if (mapScriptPromise) return mapScriptPromise;
  const apiKey = process.env.NEXT_PUBLIC_FORGE_API_KEY;
  const forgeUrl = process.env.NEXT_PUBLIC_FORGE_API_URL ?? "https://forge.butterfly-effect.dev";
  if (!apiKey) return Promise.reject(new Error("NEXT_PUBLIC_FORGE_API_KEY is not configured"));
  mapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${forgeUrl}/v1/maps/proxy/maps/api/js?key=${apiKey}&v=weekly&language=zh-TW&region=TW&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps script could not be loaded"));
    document.head.appendChild(script);
  });
  return mapScriptPromise;
}

export function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Maps is only available in the browser"));
  return loadMapScript();
}

export function MapView({ className = "", initialCenter = { lat: 25.037, lng: 121.543 }, initialZoom = 13, onMapReady }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initMap = useCallback(async () => {
    try {
      await loadGoogleMaps();
      if (!containerRef.current || !window.google?.maps) return;
      const map = new window.google.maps.Map(containerRef.current, { center: initialCenter, zoom: initialZoom, mapId: "DEMO_MAP_ID", mapTypeControl: false, fullscreenControl: false, streetViewControl: false, clickableIcons: false });
      onMapReady?.(map);
    } catch {
      if (containerRef.current) containerRef.current.innerHTML = '<div class="grid h-full place-items-center bg-violet-50 p-6 text-center text-sm font-semibold text-violet-700">地圖服務暫時無法載入。請稍後再試，或改用列表檢視。</div>';
    }
  }, [initialCenter, initialZoom, onMapReady]);
  useEffect(() => { void initMap(); }, [initMap]);
  return <div ref={containerRef} className={`h-[500px] w-full ${className}`} />;
}
