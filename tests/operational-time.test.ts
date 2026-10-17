import { expect, test } from "bun:test";
import { miamiInstant, miamiLocalTime } from "@lm/validation";

test("Miami operational timestamps resolve DST explicitly", () => {
  expect(miamiInstant("2026-11-01T01:30", "-04:00")).toBe("2026-11-01T05:30:00.000Z");
  expect(miamiInstant("2026-11-01T01:30", "-05:00")).toBe("2026-11-01T06:30:00.000Z");
  expect(() => miamiInstant("2026-03-08T02:30", "-05:00")).toThrow();
  expect(() => miamiInstant("2026-10-09T10:00", "-05:00")).toThrow();
  expect(() => miamiInstant("2026-02-30T10:00", "-05:00")).toThrow();
  expect(miamiLocalTime("2026-10-10T04:00:00Z")).toBe("2026-10-10T00:00");
});
