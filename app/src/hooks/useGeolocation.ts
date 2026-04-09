import { useState, useCallback } from "react";

export interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  request: () => void;
}

/**
 * Request device GPS coordinates.
 *
 * Security notes:
 * - Requires explicit user permission (browser location prompt)
 * - High accuracy mode uses GPS + WiFi + cell triangulation
 * - Coordinates are only used locally until user submits a report
 */
export function useGeolocation(): GeoState {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported on this device");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy));
        setLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied. Enable location to tag reports.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable. Try moving outdoors.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Try again.");
            break;
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  return { lat, lng, accuracy, error, loading, request };
}
