"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LocationGeocodeStatus = "idle" | "loading" | "success" | "error";

export type LocationGeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
  queryKey: string;
};

type GeocodeResponse = {
  item?: {
    latitude: number;
    longitude: number;
    displayName: string;
  };
  message?: string;
};

type UseLocationGeocoderOptions = {
  city: string;
  place: string;
  enabled: boolean;
  onResult: (result: LocationGeocodeResult) => void;
};

/**
 * Looks up a city/place after the user pauses typing. A manual map selection
 * can cancel the pending lookup so it remains the source of truth.
 */
export function useLocationGeocoder({ city, place, enabled, onResult }: UseLocationGeocoderOptions) {
  const [status, setStatus] = useState<LocationGeocodeStatus>("idle");
  const [displayName, setDisplayName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const onResultRef = useRef(onResult);
  const activeControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!enabled) {
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
      lastQueryRef.current = null;
      setStatus("idle");
      setDisplayName("");
      setErrorMessage("");
      return;
    }

    const trimmedCity = city.trim();
    const trimmedPlace = place.trim();
    if (trimmedCity.length < 2) {
      setStatus("idle");
      setDisplayName("");
      setErrorMessage("");
      return;
    }

    const queryKey = `${trimmedCity}|${trimmedPlace}`;
    if (lastQueryRef.current === queryKey) return;

    const controller = new AbortController();
    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;
    setStatus("loading");
    setDisplayName("");
    setErrorMessage("");

    const timer = window.setTimeout(() => {
      lastQueryRef.current = queryKey;
      const params = new URLSearchParams({ city: trimmedCity });
      if (trimmedPlace) params.set("place", trimmedPlace);
      void fetch(`/api/geocode?${params.toString()}`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          const data = (await response.json().catch(() => ({}))) as GeocodeResponse;
          if (!response.ok || !data.item) {
            throw new Error(data.message || "没有找到这个地点");
          }
          if (controller.signal.aborted) return;

          onResultRef.current({
            ...data.item,
            queryKey,
          });
          setDisplayName(data.item.displayName);
          setStatus("success");
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setStatus("error");
          setDisplayName("");
          setErrorMessage(error instanceof Error ? error.message : "地图服务暂时不可用，请稍后重试或直接在地图上选点");
        });
    }, 700);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    };
  }, [city, place, enabled, retryToken]);

  const cancel = useCallback(() => {
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
    lastQueryRef.current = null;
    setStatus("idle");
    setDisplayName("");
    setErrorMessage("");
  }, []);

  const retry = useCallback(() => {
    lastQueryRef.current = null;
    setRetryToken((current) => current + 1);
  }, []);

  return { status, displayName, errorMessage, cancel, retry };
}
