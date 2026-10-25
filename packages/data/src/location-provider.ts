export type County = "MIAMI_DADE" | "OTHER_FL" | null;
export type Resolution = {
  input: string;
  place_id: string;
  precision: "ADDRESS" | "POSTAL_CODE";
  county: County;
  state: "FL";
  country: "US";
};
type Component = {
  types: string[];
  longText?: string;
  shortText?: string;
  long_name?: string;
  short_name?: string;
};
export class LocationError extends Error {}
export function interpretPlace(
  input: string,
  id: string,
  components: Component[],
  types: string[],
): Resolution {
  const values = (type: string) =>
    components
      .filter((c) => c.types.includes(type))
      .map((c) => c.shortText ?? c.short_name ?? c.longText ?? c.long_name);
  if (values("country").length !== 1 || values("administrative_area_level_1").length !== 1)
    throw new LocationError("UNRESOLVED");
  if (values("country")[0] !== "US" || values("administrative_area_level_1")[0] !== "FL")
    throw new LocationError("OUTSIDE_FL");
  const counties = values("administrative_area_level_2");
  const county =
    counties.length === 1 && counties[0]
      ? /^Miami-Dade( County)?$/i.test(counties[0])
        ? "MIAMI_DADE"
        : "OTHER_FL"
      : null;
  if (/^\d{5}$/.test(input) && (!types.includes("postal_code") || values("postal_code")[0] !== input))
    throw new LocationError("UNRESOLVED");
  return {
    input,
    place_id: id,
    county,
    state: "FL",
    country: "US",
    precision: types.includes("postal_code") ? "POSTAL_CODE" : "ADDRESS",
  };
}
export function classifyLocations(a: { county: County }, b: { county: County }) {
  if (!a.county || !b.county) return null;
  return a.county === "MIAMI_DADE" && b.county === "MIAMI_DADE" ? "LOCAL" : "PER_MILE";
}
export function googleProvider(key: string, fetcher: typeof fetch = fetch) {
  async function call(url: string, init: RequestInit = {}) {
    if (!key) throw new LocationError("DISABLED");
    try {
      const response = await fetcher(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new LocationError("UNAVAILABLE");
      return await response.json();
    } catch (error) {
      if (error instanceof LocationError) throw error;
      throw new LocationError("UNAVAILABLE");
    }
  }
  return {
    async suggest(input: string, session: string, language: string) {
      const result = await call("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
        body: JSON.stringify({
          input,
          sessionToken: session,
          languageCode: language,
          includedRegionCodes: ["us"],
          ...(/^\d{5}$/.test(input) ? { includedPrimaryTypes: ["postal_code"] } : {}),
          locationBias: {
            rectangle: {
              low: { latitude: 24.4, longitude: -87.7 },
              high: { latitude: 31.1, longitude: -79.8 },
            },
          },
        }),
      });
      return (result.suggestions ?? [])
        .flatMap((s: { placePrediction?: { placeId?: string; text?: { text?: string } } }) =>
          s.placePrediction?.placeId && s.placePrediction.text?.text
            ? [{ id: s.placePrediction.placeId, label: s.placePrediction.text.text }]
            : [],
        )
        .slice(0, 5);
    },
    async resolve(input: string, id: string, session: string, language: string) {
      const detail = await call(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?sessionToken=${encodeURIComponent(session)}&languageCode=${language}`,
        { headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "id,addressComponents,types" } },
      );
      let resolved = interpretPlace(input, id, detail.addressComponents ?? [], detail.types ?? []);
      if (!resolved.county && /^\d{5}$/.test(input)) {
        const geo = await call(
          `https://maps.googleapis.com/maps/api/geocode/json?components=${encodeURIComponent(`postal_code:${input}|country:US|administrative_area:FL`)}&key=${encodeURIComponent(key)}`,
        );
        if (geo.status === "OK" && geo.results?.length === 1 && !geo.results[0].partial_match)
          resolved = interpretPlace(
            input,
            id,
            geo.results[0].address_components ?? [],
            geo.results[0].types ?? [],
          );
      }
      return resolved;
    },
  };
}
