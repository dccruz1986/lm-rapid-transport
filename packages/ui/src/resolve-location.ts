/// <reference types="google.maps" />
import { importLibrary } from "@googlemaps/js-api-loader";
import { configureGoogleMaps, withLocationTimeout } from "./google-places";

export type SavedLocation = {
  input: string;
  street: string;
  city: string;
  postal_code: string;
  place_id: string | null;
  precision: string;
};
export type ResolvedLocation = {
  position: google.maps.LatLngLiteral;
  precision: "ADDRESS" | "POSTAL_CODE";
  details?: Pick<SavedLocation, "street" | "city" | "postal_code" | "place_id">;
};
export type LocationStatus = "pending" | "loading" | "address" | "postal" | "error";
export function locationKey(address: SavedLocation) {
  return JSON.stringify([
    address.input,
    address.street,
    address.city,
    address.postal_code,
    address.place_id,
    address.precision,
  ]);
}
export function compatibleResult(
  address: SavedLocation,
  result: google.maps.GeocoderResult,
): ResolvedLocation | null {
  const component = (type: string) =>
    result.address_components.find((c) => c.types.includes(type))?.short_name ?? "";
  if (
    result.partial_match ||
    component("country") !== "US" ||
    component("administrative_area_level_1") !== "FL"
  )
    return null;
  const zip = address.postal_code || (/^\d{5}$/.test(address.input.trim()) ? address.input.trim() : "");
  if (zip && component("postal_code") !== zip.slice(0, 5)) return null;
  const postal =
    !address.street && (/^\d{5}$/.test(address.input.trim()) || address.precision === "POSTAL_CODE");
  if (!postal) {
    if (!component("street_number") || !component("route")) return null;
    const number = (address.street || address.input).match(/^\s*(\d+[A-Za-z-]*)\b/)?.[1];
    if (number && number.toLowerCase() !== component("street_number").toLowerCase()) return null;
    // Do not accept a stale ID pointing to a different street in the same ZIP.
    if (address.street) {
      const normalize = (s: string) =>
        s
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, "")
          .replace(
            /\b(northwest|northeast|southwest|southeast|north|south|east|west|street|avenue|road|drive|lane|boulevard|court|terrace)\b/g,
            (word) =>
              ({
                northwest: "nw",
                northeast: "ne",
                southwest: "sw",
                southeast: "se",
                north: "n",
                south: "s",
                east: "e",
                west: "w",
                street: "st",
                avenue: "ave",
                road: "rd",
                drive: "dr",
                lane: "ln",
                boulevard: "blvd",
                court: "ct",
                terrace: "ter",
              })[word] ?? word,
          )
          .replace(/\s+/g, " ")
          .trim();
      if (normalize(address.street) !== normalize(`${component("street_number")} ${component("route")}`))
        return null;
    }
  }
  return {
    position: result.geometry.location.toJSON(),
    precision: postal ? "POSTAL_CODE" : "ADDRESS",
    details: {
      street: postal ? "" : `${component("street_number")} ${component("route")}`,
      city: component("locality"),
      postal_code: component("postal_code"),
      place_id: result.place_id,
    },
  };
}

export async function resolveSavedLocation(address: SavedLocation): Promise<ResolvedLocation | null> {
  if (!address.input.trim() && !address.place_id) return null;
  configureGoogleMaps();
  const { Geocoder } = await withLocationTimeout(importLibrary("geocoding"));
  const geocoder = new Geocoder();
  return resolveWithGeocoder(address, (request) => geocoder.geocode(request));
}
export async function resolveWithGeocoder(
  address: SavedLocation,
  geocode: (request: google.maps.GeocoderRequest) => Promise<google.maps.GeocoderResponse>,
) {
  const resolve = async (request: google.maps.GeocoderRequest) => {
    const response = await withLocationTimeout(geocode(request));
    const first = response.results[0];
    return response.results.length === 1 && first ? compatibleResult(address, first) : null;
  };
  if (address.place_id) {
    try {
      const result = await resolve({ placeId: address.place_id });
      if (result) return result;
    } catch (error) {
      // Quota/auth/transport failures should not trigger a second billable request.
      const code = (error as { code?: string }).code;
      if (code !== "ZERO_RESULTS" && code !== "INVALID_REQUEST" && code !== "NOT_FOUND") throw error;
    }
  }
  return resolve({
    address: address.input,
    componentRestrictions: { country: "US", administrativeArea: "FL" },
  });
}

// Scoped to the mounted route provider: no persistent coordinate cache.
export function locationResolver(resolve = resolveSavedLocation) {
  const cache = new Map<string, Promise<ResolvedLocation | null>>();
  return (address: SavedLocation, retry = false) => {
    const key = locationKey(address);
    if (retry) cache.delete(key);
    let value = cache.get(key);
    if (!value) {
      value = resolve(address);
      cache.set(key, value);
    }
    return value;
  };
}
