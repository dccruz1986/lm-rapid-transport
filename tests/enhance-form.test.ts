import { expect, test } from "bun:test";
import { initialQuoteDraft, reconcileQuote } from "../apps/admin/src/components/quote-draft";
import {
  countyTerritory,
  distanceMiles,
  routeEstimator,
  suggestedMode,
} from "../apps/admin/src/components/route-estimate";
import { withLocationTimeout } from "../packages/ui/src/google-places";

const rates = (mode: string) => (mode === "PER_MILE" ? "6.50" : "125.00");
const route = { key: "A:B", mode: "PER_MILE" as const, miles: 205.6 };
test("county evidence drives mode, never postal city; missing/ambiguous/outside is not eligible", () => {
  expect(countyTerritory("Miami-Dade County")).toBe("MIAMI_DADE");
  expect(countyTerritory("Palm Beach County")).toBe("OTHER_FL");
  expect(countyTerritory("")).toBe("UNKNOWN");
  expect(suggestedMode(["MIAMI_DADE", "MIAMI_DADE"])).toBe("LOCAL");
  expect(suggestedMode(["MIAMI_DADE", "OTHER_FL"])).toBe("PER_MILE");
  expect(suggestedMode(["OTHER_FL", "OTHER_FL"])).toBe("PER_MILE");
  expect(suggestedMode(["OTHER_FL", "UNKNOWN"])).toBeNull();
  expect(suggestedMode(["OUTSIDE_FL", "OTHER_FL"])).toBeNull();
});
test("road meters become rounded one-way miles, rejecting missing, invalid and excessive distances", () => {
  expect(distanceMiles(160934.4)).toBe(100);
  expect(distanceMiles(331000)).toBe(205.7);
  for (const meters of [undefined, NaN, Infinity, -1, 0, 1, 1609.344 * 10001])
    expect(() => distanceMiles(meters)).toThrow();
});
test("deduplicates pending and completed calculations; retry only on request", async () => {
  let calls = 0;
  const estimator = routeEstimator(async () => {
    calls++;
    return 205;
  });
  const point = { lat: 25, lng: -80 };
  const first = estimator("A:B", point, point);
  expect(estimator("A:B", point, point)).toBe(first);
  expect(await first).toBe(205);
  expect(await estimator("A:B", point, point)).toBe(205);
  expect(calls).toBe(1);
  await estimator("A:B", point, point, true);
  await estimator("B:A", point, point);
  expect(calls).toBe(3);
});
test("provider failure is cached until retry; no invented distance", async () => {
  let calls = 0;
  const estimator = routeEstimator(async () => {
    if (++calls === 1) throw new Error("REQUEST_DENIED");
    return 90;
  });
  const point = { lat: 25, lng: -80 };
  await expect(estimator("route", point, point)).rejects.toThrow("REQUEST_DENIED");
  await expect(estimator("route", point, point)).rejects.toThrow("REQUEST_DENIED");
  expect(calls).toBe(1);
  expect(await estimator("route", point, point, true)).toBe(90);
});
test("new quote switches units and configured rate, never treating three hours as miles", () => {
  const local = initialQuoteDraft("LOCAL", "125.00");
  const loading = reconcileQuote(local, { ...route, miles: undefined }, rates);
  expect(loading.mode).toBe("PER_MILE");
  expect(loading.rate).toBe("6.50");
  expect(loading.PER_MILE.value).toBe("");
  const ready = reconcileQuote(loading, route, rates);
  expect(ready.PER_MILE.value).toBe("205.6");
  expect(reconcileQuote(ready, route, rates)).toBe(ready);
  expect(reconcileQuote(ready, { key: "local", mode: "LOCAL" }, rates).LOCAL.value).toBe("3");
});
test("manual edits during lookup and existing snapshots survive suggestions", () => {
  const manual = {
    ...initialQuoteDraft("PER_MILE", "6.50"),
    PER_MILE: { value: "205", source: "manual" as const },
  };
  expect(reconcileQuote(manual, route, rates).PER_MILE.value).toBe("205");
  const saved = initialQuoteDraft("LOCAL", "90.00", 7);
  expect(reconcileQuote(saved, route, rates)).toBe(saved);
  const savedMiles = initialQuoteDraft("PER_MILE", "4.00", 180);
  expect(reconcileQuote(savedMiles, route, rates)).toBe(savedMiles);
  const customRate = { ...manual, rate: "7.00", rateManual: true };
  expect(reconcileQuote(customRate, { ...route, mode: "LOCAL" }, rates).rate).toBe("7.00");
  const customMode = { ...initialQuoteDraft("LOCAL", "125.00"), modeManual: true };
  expect(reconcileQuote(customMode, route, rates).mode).toBe("LOCAL");
});
test("changed route clears automatic estimates but keeps manual quantities and units independent", () => {
  const ready = reconcileQuote(initialQuoteDraft("PER_MILE", "6.50"), route, rates);
  const changed = { key: "A:C", mode: null, miles: undefined };
  expect(reconcileQuote(ready, changed, rates).PER_MILE.value).toBe("");
  const manual = { ...ready, PER_MILE: { value: "210", source: "manual" as const } };
  expect(reconcileQuote(manual, changed, rates).PER_MILE.value).toBe("210");
  expect(Object.keys(ready)).not.toContain("actual_miles");
});
test("bounded request rejects a stalled provider", async () => {
  const original = globalThis.setTimeout;
  globalThis.setTimeout = ((fn: () => void) => original(fn, 1)) as typeof setTimeout;
  try {
    await expect(withLocationTimeout(new Promise(() => {}))).rejects.toThrow("UNAVAILABLE");
  } finally {
    globalThis.setTimeout = original;
  }
});
