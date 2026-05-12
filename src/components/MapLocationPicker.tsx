import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, label: string) => void;
  defaultLat: number;
  defaultLng: number;
};

declare global {
  interface Window {
    jkGoogleMapsCallback?: () => void;
  }
}

const loadMapsScript = (apiKey: string): Promise<void> => {
  if (typeof google !== "undefined" && google.maps) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-jk-google-maps="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Maps script failed")), { once: true });
      return;
    }
    window.jkGoogleMapsCallback = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=jkGoogleMapsCallback`;
    s.async = true;
    s.defer = true;
    s.dataset.jkGoogleMaps = "1";
    s.onerror = () => reject(new Error("Could not load Google Maps"));
    document.head.appendChild(s);
  });
};

const reverseGeocodeOsm = async (lat: number, lng: number): Promise<string> => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "JyotishKundliPWA/1.0 (offline-first astrology; local-app)"
      }
    });
    if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};

export default function MapLocationPicker({ open, onClose, onConfirm, defaultLat, defaultLng }: Props): JSX.Element | null {
  const { t } = useTranslation();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkerRef = useRef<L.Marker | null>(null);
  const leafletLayerRef = useRef<L.TileLayer | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const useGoogle = Boolean(apiKey?.trim());

  const cleanupLeaflet = useCallback(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
    leafletMarkerRef.current = null;
    leafletLayerRef.current = null;
  }, []);

  const initGoogle = useCallback(async () => {
    if (!apiKey || !mapEl.current) return;
    setError("");
    try {
      await loadMapsScript(apiKey);
      const maps = google.maps;
      const center = { lat: defaultLat, lng: defaultLng };
      const map = new maps.Map(mapEl.current, {
        center,
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false
      });
      mapRef.current = map;
      const marker = new maps.Marker({ position: center, map, draggable: true });
      markerRef.current = marker;
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [apiKey, defaultLat, defaultLng]);

  const initLeaflet = useCallback(() => {
    if (!mapEl.current) return;
    setError("");
    cleanupLeaflet();
    mapEl.current.innerHTML = "";
    const map = L.map(mapEl.current, {
      center: [defaultLat, defaultLng],
      zoom: 11,
      scrollWheelZoom: true
    });
    leafletMapRef.current = map;
    const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    tiles.addTo(map);
    leafletLayerRef.current = tiles;
    const icon = L.divIcon({
      className: "jk-leaflet-marker",
      html: '<div class="jk-leaflet-marker-dot"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    const marker = L.marker([defaultLat, defaultLng], { draggable: true, icon }).addTo(map);
    leafletMarkerRef.current = marker;
    map.whenReady(() => {
      map.invalidateSize();
      setReady(true);
    });
  }, [cleanupLeaflet, defaultLat, defaultLng]);

  useEffect(() => {
    if (!open) {
      setReady(false);
      mapRef.current = null;
      markerRef.current = null;
      cleanupLeaflet();
      return;
    }
    setReady(false);
    const t0 = window.setTimeout(() => {
      if (useGoogle) void initGoogle();
      else initLeaflet();
    }, 0);
    return () => {
      window.clearTimeout(t0);
    };
  }, [cleanupLeaflet, initGoogle, initLeaflet, open, useGoogle]);

  if (!open) return null;

  const handleConfirm = () => {
    if (useGoogle) {
      const marker = markerRef.current;
      const maps = typeof google !== "undefined" ? google.maps : undefined;
      if (!marker || !maps) return;
      const pos = marker.getPosition();
      if (!pos) return;
      const geocoder = new maps.Geocoder();
      void geocoder.geocode({ location: pos }, (results, status) => {
        const label =
          status === google.maps.GeocoderStatus.OK && results?.[0]?.formatted_address
            ? results[0].formatted_address
            : `${pos.lat().toFixed(4)}, ${pos.lng().toFixed(4)}`;
        onConfirm(pos.lat(), pos.lng(), label);
        onClose();
      });
      return;
    }

    const m = leafletMarkerRef.current;
    const map = leafletMapRef.current;
    if (!m || !map) return;
    const ll = m.getLatLng();
    void (async () => {
      const label = await reverseGeocodeOsm(ll.lat, ll.lng);
      onConfirm(ll.lat, ll.lng, label);
      onClose();
    })();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-indigo-950">{t("kundli.mapPickerTitle")}</h3>
          <button type="button" className="text-sm text-slate-600 underline" onClick={onClose}>
            {t("common.cancel")}
          </button>
        </div>
        <p className="px-4 pt-2 text-xs text-slate-600">
          {useGoogle ? t("kundli.mapPickerPrivacy") : t("kundli.mapPickerOsmPrivacy")}
        </p>
        {error ? <p className="px-4 py-2 text-sm text-red-700">{error}</p> : null}
        <div ref={mapEl} className="h-72 w-full bg-slate-100" />
        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={!ready}
            className="rounded-lg bg-[color:var(--jk-accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => handleConfirm()}
          >
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
