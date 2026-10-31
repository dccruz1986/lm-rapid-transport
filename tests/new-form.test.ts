import { describe, expect, test } from "bun:test";
import { intakeV2Schema, publicIntakeSchema } from "@lm/validation";
import { classifyLocations, googleProvider, interpretPlace } from "../packages/data/src/location-provider";

export const minimalIntake = {
  version: 2,
  full_name: "María del Carmen López",
  email: null,
  phone: "3055550101",
  origin: { input: "33147", resolution_token: null },
  destination: { input: "33016", resolution_token: null },
  move_size: "STUDIO",
  moving_date: null,
  comments: "Synthetic new-form fixture",
  workers: null,
  property_size: null,
  size_unit: null,
  property_type: null,
  origin_floor: null,
  destination_floor: null,
  origin_elevator: null,
  destination_elevator: null,
  origin_unit: null,
  destination_unit: null,
};
const components = (county = "Miami-Dade County", state = "FL") => [
  { types: ["country"], shortText: "US" },
  { types: ["administrative_area_level_1"], shortText: state },
  { types: ["administrative_area_level_2"], shortText: county },
  { types: ["postal_code"], shortText: "33147" },
];
describe("simple intake", () => {
  test("minimal data preserves compound name and unknown details", () => {
    const d = intakeV2Schema.parse(minimalIntake);
    expect(d.full_name).toBe(minimalIntake.full_name);
    expect(d.origin_floor).toBeNull();
    expect(d.origin_elevator).toBeNull();
  });
  test.each(["STUDIO", "BEDROOMS_5_PLUS", "OFFICE", "COMMERCIAL"])(
    "accepts size %s without invented property",
    (size) => expect(intakeV2Schema.safeParse({ ...minimalIntake, move_size: size }).success).toBe(true),
  );
  test("rejects missing name, invalid phone and forged territorial inputs", () => {
    for (const extra of [
      { full_name: "" },
      { phone: "+14165550101" },
      { suggested_mode: "LOCAL" },
      { origin: { input: "33147", resolution_token: null, county: "MIAMI_DADE" } },
    ])
      expect(intakeV2Schema.safeParse({ ...minimalIntake, ...extra }).success).toBe(false);
  });
  test("rejects incompatible property and size", () =>
    expect(
      intakeV2Schema.safeParse({ ...minimalIntake, move_size: "OFFICE", property_type: "HOUSE" }).success,
    ).toBe(false));
  test("rejects invalid dates", () => {
    for (const date of ["2020-01-01", "2030-02-30", "2030-01-06"])
      expect(intakeV2Schema.safeParse({ ...minimalIntake, moving_date: date }).success).toBe(false);
  });
  test("accepts versioned envelope", () =>
    expect(
      publicIntakeSchema.safeParse({ key: crypto.randomUUID(), website: "", data: minimalIntake }).success,
    ).toBe(true));
});
describe("county resolution", () => {
  test("ZIP uses county and keeps postal precision", () =>
    expect(interpretPlace("33147", "p", components(), ["postal_code"])).toMatchObject({
      precision: "POSTAL_CODE",
      county: "MIAMI_DADE",
    }));
  test.each(["Hialeah", "Miami Beach"])("%s in county is hourly", (city) => {
    const r = interpretPlace(
      city,
      "p",
      [...components(), { types: ["locality"], shortText: city }],
      ["street_address"],
    );
    expect(classifyLocations(r, r)).toBe("LOCAL");
  });
  test("Broward endpoint makes trip per mile", () =>
    expect(
      classifyLocations(
        { county: "MIAMI_DADE" },
        interpretPlace("address", "p", components("Broward County"), ["street_address"]),
      ),
    ).toBe("PER_MILE"));
  test("outside FL rejected", () =>
    expect(() => interpretPlace("address", "p", components("Fulton", "GA"), ["street_address"])).toThrow(
      "OUTSIDE_FL",
    ));
  test("missing or conflicting county stays unclassified", () => {
    for (const cs of [
      components().filter((c) => !c.types.includes("administrative_area_level_2")),
      [...components(), { types: ["administrative_area_level_2"], shortText: "Broward County" }],
    ])
      expect(
        classifyLocations(interpretPlace("address", "p", cs, ["street_address"]), { county: "MIAMI_DADE" }),
      ).toBeNull();
  });
  test("street number matching ZIP is not a postal result", () =>
    expect(() => interpretPlace("33147", "p", components(), ["street_address"])).toThrow("UNRESOLVED"));
  test("missing key does not call Google", async () => {
    let called = false;
    const p = googleProvider("", (async () => {
      called = true;
      return Response.json({});
    }) as unknown as typeof fetch);
    await expect(p.suggest("33147", crypto.randomUUID(), "en")).rejects.toThrow("DISABLED");
    expect(called).toBe(false);
  });
  test.each([403, 429, 500])("handles provider status %s", async (status) => {
    const p = googleProvider(
      "fixture",
      (async () => new Response(null, { status })) as unknown as typeof fetch,
    );
    await expect(p.suggest("33147", crypto.randomUUID(), "en")).rejects.toThrow("UNAVAILABLE");
  });
  test("timeout falls back to unavailable", async () => {
    const p = googleProvider("fixture", (async () => {
      throw new DOMException("timeout", "TimeoutError");
    }) as unknown as typeof fetch);
    await expect(p.suggest("33147", crypto.randomUUID(), "en")).rejects.toThrow("UNAVAILABLE");
  });
  test("requests postal suggestions and resolves details with minimal fields", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const p = googleProvider("fixture", (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return Response.json(
        String(url).includes(":autocomplete")
          ? { suggestions: [{ placePrediction: { placeId: "p", text: { text: "33147 Florida" } } }] }
          : { addressComponents: components(), types: ["postal_code"] },
      );
    }) as unknown as typeof fetch);
    expect(await p.suggest("33147", "session", "en")).toHaveLength(1);
    expect(JSON.parse(String(calls[0]?.init?.body)).includedPrimaryTypes).toEqual(["postal_code"]);
    expect((await p.resolve("33147", "p", "session", "en")).county).toBe("MIAMI_DADE");
  });
});
