import { describe, expect, test } from "bun:test";
import { miamiDate } from "@lm/validation";

describe("Miami business calendar", () => {
  test("uses Miami's date when UTC has moved to tomorrow", () => {
    expect(miamiDate(new Date("2026-10-09T02:00:00Z"))).toBe("2026-10-08");
  });
  test("uses the winter offset rather than a fixed UTC-4 offset", () => {
    expect(miamiDate(new Date("2026-12-01T04:30:00Z"))).toBe("2026-11-30");
  });
});
