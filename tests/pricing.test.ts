import { describe, expect, test } from "bun:test";
import { calculateTotal, dollarsToCents, elapsedHours } from "@lm/validation";

describe("agreed prices", () => {
  test("applies the team rate once and the minimum", () => {
    expect(calculateTotal("LOCAL", 2, 11900).totalCents).toBe(35700);
    expect(calculateTotal("LOCAL", 3, 14500).totalCents).toBe(43500);
    expect(calculateTotal("LOCAL", 3, 16500).totalCents).toBe(49500);
  });
  test("rounds hours and miles upward", () => {
    expect(calculateTotal("LOCAL", 3 + 40 / 60, 11900)).toEqual({ billable: 4, totalCents: 47600 });
    expect(calculateTotal("PER_MILE", 125.4, 400)).toEqual({ billable: 126, totalCents: 50400 });
  });
  test("no mileage minimum or worker multiplier", () =>
    expect(calculateTotal("PER_MILE", 0.1, 400).totalCents).toBe(400));
  test("does not round an exact hour up again", () =>
    expect(calculateTotal("LOCAL", 5, 14500).totalCents).toBe(72500));
  test("preserves cents without floating point money", () => expect(dollarsToCents("119.99")).toBe(11999));
  test("rejects invalid values", () => {
    for (const value of [NaN, Infinity, 0, -1]) expect(() => calculateTotal("LOCAL", value, 11900)).toThrow();
    expect(() => dollarsToCents("1.999")).toThrow();
  });
  test("overnight measurements", () =>
    expect(elapsedHours("2026-10-08T23:00:00-04:00", "2026-10-09T02:30:00-04:00")).toBe(3.5));
  test("rejects reversed measurements", () =>
    expect(() => elapsedHours("2026-10-09T02:00:00Z", "2026-10-08T23:00:00Z")).toThrow());
});
