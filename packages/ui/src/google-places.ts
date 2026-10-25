/// <reference types="google.maps" />
"use client";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;
export function configureGoogleMaps() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("DISABLED");
  if (!configured) {
    setOptions({ key, v: "weekly", region: "US" });
    configured = true;
  }
}
export async function loadPlaces() {
  configureGoogleMaps();
  return importLibrary("places");
}
export async function withLocationTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("UNAVAILABLE")), 8000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
