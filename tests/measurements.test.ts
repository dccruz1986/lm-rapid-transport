import { expect, test } from "bun:test";
import { miamiLocalTime, miamiOffset, validateMeasurements } from "@lm/validation";

const now = Date.parse("2026-11-03T18:00:00Z");
const input = {
  start: "2026-11-02T20:34",
  start_offset: "-05:00",
  end: "2026-11-03T01:00",
  end_offset: "-05:00",
  miles: "205",
};
test("save and reload retain the instants and miles used to complete", () => {
  const saved = validateMeasurements(input, "save", "PER_MILE", now);
  expect(saved.error).toBe("");
  if (saved.error || !saved.start || !saved.end) throw new Error("fixture");
  const reloaded = {
    start: miamiLocalTime(saved.start),
    start_offset: miamiOffset(saved.start),
    end: miamiLocalTime(saved.end),
    end_offset: miamiOffset(saved.end),
    miles: String(saved.miles),
  };
  expect(validateMeasurements(reloaded, "complete", "PER_MILE", now)).toEqual(saved);
});
test("partial save succeeds but closing identifies missing fields", () => {
  expect(validateMeasurements({ ...input, end: "" }, "save", "PER_MILE", now).error).toBe("");
  expect(validateMeasurements({ ...input, end: "" }, "complete", "PER_MILE", now).error).toBe(
    "MOVE_END_REQUIRED",
  );
  expect(validateMeasurements({ ...input, miles: "" }, "complete", "PER_MILE", now).error).toBe(
    "MOVE_MILES_REQUIRED",
  );
  expect(validateMeasurements({ ...input, miles: "" }, "complete", "LOCAL", now).error).toBe("");
  expect(validateMeasurements({ ...input, start: "" }, "save", "LOCAL", now).error).toBe(
    "MOVE_START_REQUIRED",
  );
});
test("invalid time and distance cannot close a move", () => {
  for (const end of [input.start, "2026-11-02T19:00", "2026-11-04T01:00"]) {
    expect(validateMeasurements({ ...input, end }, "complete", "PER_MILE", now).error).toBe(
      "MOVE_END_INVALID",
    );
  }
  expect(validateMeasurements({ ...input, end_offset: "-04:00" }, "complete", "PER_MILE", now).error).toBe(
    "MOVE_END_INVALID",
  );
  for (const miles of ["0", "-2", "NaN", "10001", "1.00001"]) {
    expect(validateMeasurements({ ...input, miles }, "complete", "PER_MILE", now).error).toBe(
      "MOVE_MILES_INVALID",
    );
  }
});
test("fall clock change respects explicit offsets and elapsed duration", () => {
  const result = validateMeasurements(
    {
      ...input,
      start: "2026-11-01T01:30",
      start_offset: "-04:00",
      end: "2026-11-01T01:30",
      end_offset: "-05:00",
      miles: "",
    },
    "complete",
    "LOCAL",
    now,
  );
  expect(result.error).toBe("");
  if (!result.start || !result.end) throw new Error("fixture");
  expect(Date.parse(result.end) - Date.parse(result.start)).toBe(3600000);
});
