import { importLibrary } from "@googlemaps/js-api-loader";
import { configureGoogleMaps, withLocationTimeout } from "@lm/ui/google-places";

export type Territory = "MIAMI_DADE" | "OTHER_FL" | "UNKNOWN" | "OUTSIDE_FL";
export function routeFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/denied|blocked|not authorized|permission|not been used|not enabled|api.key/i.test(message))
    return "authorization";
  if (/Route|computeRoutes/.test(message) && /undefined|not a function|not available/i.test(message))
    return "sdk";
  if (/UNAVAILABLE|timeout/i.test(message)) return "timeout";
  if (/INVALID_DISTANCE|ZERO_RESULTS|no route/i.test(message)) return "no-route";
  return "unavailable";
}
export function countyTerritory(county?: string): Territory {
  if (!county?.trim()) return "UNKNOWN";
  return /^miami[-\s]dade(?: county)?$/i.test(county.trim()) ? "MIAMI_DADE" : "OTHER_FL";
}
export function suggestedMode(territories: Territory[]): "LOCAL" | "PER_MILE" | null {
  if (territories.length !== 2 || territories.some((t) => t === "UNKNOWN" || t === "OUTSIDE_FL")) return null;
  return territories.every((t) => t === "MIAMI_DADE") ? "LOCAL" : "PER_MILE";
}
export function distanceMiles(meters: number | undefined) {
  if (meters === undefined || !Number.isFinite(meters) || meters <= 0 || meters / 1609.344 > 10000)
    throw new Error("INVALID_DISTANCE");
  const miles = Math.round((meters / 1609.344) * 10) / 10;
  if (miles <= 0) throw new Error("INVALID_DISTANCE");
  return miles;
}
export async function roadMiles(origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) {
  configureGoogleMaps();
  const { Route } = await withLocationTimeout(importLibrary("routes"));
  const result = await withLocationTimeout(
    Route.computeRoutes({
      origin,
      destination,
      fields: ["distanceMeters"],
      travelMode: "DRIVING",
      routingPreference: "TRAFFIC_UNAWARE",
    }),
  );
  return distanceMiles(result.routes?.[0]?.distanceMeters);
}
// Only the current view owns this cache, including failures until explicit retry.
export function routeEstimator(resolve = roadMiles) {
  const cache = new Map<string, Promise<number>>();
  return (
    key: string,
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral,
    retry = false,
  ) => {
    if (retry) cache.delete(key);
    let value = cache.get(key);
    if (!value) {
      value = resolve(origin, destination);
      cache.set(key, value);
    }
    return value;
  };
}
