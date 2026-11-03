import { expect, test } from "bun:test";
import {
  compatibleResult,
  locationResolver,
  resolveWithGeocoder,
  type SavedLocation,
} from "../packages/ui/src/resolve-location";

const address: SavedLocation = {
  input: "5011 Broadway, West Palm Beach, FL 33407",
  street: "5011 Broadway",
  city: "West Palm Beach",
  postal_code: "33407",
  place_id: "saved-id",
  precision: "ADDRESS",
};
function result(overrides: Partial<google.maps.GeocoderResult> = {}): google.maps.GeocoderResult {
  return {
    address_components: Object.entries({
      street_number: "5011",
      route: "Broadway",
      locality: "West Palm Beach",
      postal_code: "33407",
      country: "US",
      administrative_area_level_1: "FL",
    }).map(([type, value]) => ({ types: [type], short_name: value, long_name: value })),
    formatted_address: address.input,
    place_id: "saved-id",
    types: ["street_address"],
    geometry: { location: { toJSON: () => ({ lat: 26.75, lng: -80.06 }) } } as google.maps.GeocoderGeometry,
    ...overrides,
  };
}
test("restores exact addresses and refuses partial or incompatible results", () => {
  expect(compatibleResult(address, result())?.precision).toBe("ADDRESS");
  expect(compatibleResult(address, result({ partial_match: true }))).toBeNull();
  expect(compatibleResult({ ...address, street: "999 Broadway" }, result())).toBeNull();
  expect(compatibleResult({ ...address, postal_code: "33147" }, result())).toBeNull();
  const outside = result();
  outside.address_components = outside.address_components.map((c) =>
    c.types.includes("administrative_area_level_1") ? { ...c, short_name: "NY" } : c,
  );
  expect(compatibleResult(address, outside)).toBeNull();
});
test("postal point stays approximate", () => {
  expect(
    compatibleResult({ ...address, input: "33407", street: "", precision: "POSTAL_CODE" }, result())
      ?.precision,
  ).toBe("POSTAL_CODE");
});
test("saved ID precedes historical text; obsolete ID falls back once", async () => {
  const calls: google.maps.GeocoderRequest[] = [];
  const geocode = async (request: google.maps.GeocoderRequest) => {
    calls.push(request);
    return { results: request.placeId ? [] : [result()] };
  };
  expect(await resolveWithGeocoder(address, geocode)).not.toBeNull();
  expect(calls).toHaveLength(2);
  expect(calls[0]?.placeId).toBe("saved-id");
  expect(calls[1]?.address).toBe(address.input);
});
test("ambiguous historical results never choose the first", async () => {
  expect(
    await resolveWithGeocoder({ ...address, place_id: null }, async () => ({
      results: [result(), result()],
    })),
  ).toBeNull();
});
test("provider auth failure does not repeat requests", async () => {
  let calls = 0;
  await expect(
    resolveWithGeocoder(address, async () => {
      calls++;
      throw { code: "REQUEST_DENIED" };
    }),
  ).rejects.toEqual({ code: "REQUEST_DENIED" });
  expect(calls).toBe(1);
});
test("shared resolver deduplicates in-flight, settled, and failed results until explicit retry", async () => {
  let calls = 0;
  const resolve = locationResolver(async () => {
    calls++;
    return compatibleResult(address, result());
  });
  const first = resolve(address);
  expect(resolve({ ...address })).toBe(first);
  await first;
  await resolve({ ...address });
  expect(calls).toBe(1);
  await resolve(address, true);
  expect(calls).toBe(2);
  let failures = 0;
  const failing = locationResolver(async () => {
    failures++;
    throw new Error("offline");
  });
  await failing(address).catch(() => {});
  await failing(address).catch(() => {});
  expect(failures).toBe(1);
});
