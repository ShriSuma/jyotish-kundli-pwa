import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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

export default function MapLocationPicker({ open, onClose, onConfirm, defaultLat, defaultLng }: Props): JSX.Element | null {
  const { t } = useTranslation();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const initMap = useCallback(async () => {
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

  useEffect(() => {
    if (!open) {
      setReady(false);
      mapRef.current = null;
      markerRef.current = null;
      return;
    }
    if (!apiKey) {
      setError("missing_key");
      return;
    }
    void initMap();
  }, [apiKey, initMap, open]);

  if (!open) return null;

  const handleConfirm = () => {
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
        <p className="px-4 pt-2 text-xs text-slate-600">{t("kundli.mapPickerPrivacy")}</p>
        {!apiKey ? (
          <p className="px-4 py-2 text-sm text-amber-800">{t("kundli.mapPickerNoKey")}</p>
        ) : (
          error &&
          error !== "missing_key" && <p className="px-4 py-2 text-sm text-red-700">{error}</p>
        )}
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
