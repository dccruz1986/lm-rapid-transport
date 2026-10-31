import { afterAll, expect, mock, test } from "bun:test";

const originalKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const options = mock(() => {});
const library = { AutocompleteSuggestion: {} };
const imports = mock(async () => library);
mock.module("@googlemaps/js-api-loader", () => ({ setOptions: options, importLibrary: imports }));
const { loadPlaces, withLocationTimeout } = await import("../packages/ui/src/google-places");
afterAll(() => {
  if (originalKey === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  else process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalKey;
  mock.restore();
});
test("missing browser key preserves manual fallback without loading Google", async () => {
  delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  await expect(loadPlaces()).rejects.toThrow("DISABLED");
  expect(imports).not.toHaveBeenCalled();
});
test("configures loader once and loads only Places", async () => {
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-placeholder";
  expect<unknown>(await loadPlaces()).toBe(library);
  await loadPlaces();
  expect(options).toHaveBeenCalledTimes(1);
  expect(options).toHaveBeenCalledWith({ key: "test-placeholder", v: "weekly", region: "US" });
  expect(imports).toHaveBeenCalledWith("places");
});
test("provider results and errors pass through bounded calls", async () => {
  expect(await withLocationTimeout(Promise.resolve("result"))).toBe("result");
  await expect(withLocationTimeout(Promise.reject(new Error("quota")))).rejects.toThrow("quota");
});
