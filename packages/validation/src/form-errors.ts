import type { FieldErrors, FieldIssue, FormOutcome } from "@lm/types";
import type { z } from "zod";

const known = new Set([
  "PHONE_US",
  "DATE_INVALID",
  "DATE_TOMORROW",
  "DATE_SUNDAY",
  "BEDROOMS_REQUIRED",
  "BEDROOMS_COMMERCIAL",
  "SIZE_UNIT_REQUIRED",
  "PROPERTY_SIZE_MISMATCH",
  "DURATION_LIMIT",
]);
export function issueCode(issue: z.core.$ZodIssue): FieldIssue {
  if (known.has(issue.message)) return { code: issue.message };
  if (issue.code === "too_small" && issue.origin === "string" && issue.minimum === 1)
    return { code: "REQUIRED" };
  if (issue.code === "too_small")
    return {
      code: issue.origin === "string" ? "MIN_LENGTH" : issue.inclusive ? "MIN_VALUE" : "ABOVE_VALUE",
      limit: String(issue.minimum),
    };
  if (issue.code === "too_big")
    return { code: issue.origin === "string" ? "MAX_LENGTH" : "MAX_VALUE", limit: String(issue.maximum) };
  if (issue.code === "invalid_format" && issue.format === "email") return { code: "EMAIL" };
  if (issue.code === "invalid_value" || issue.code === "invalid_union") return { code: "CHOICE" };
  return { code: "INVALID" };
}
// Explicit allowlist: hidden identifiers and unexpected paths remain general.
export function validationFailure(
  error: z.ZodError,
  fields: readonly string[],
  aliases: Record<string, string> = {},
): FormOutcome {
  const fieldErrors: FieldErrors = {};
  let general = false;
  for (const issue of error.issues) {
    const path = issue.path.map(String).join(".");
    const root = String(issue.path[0] ?? "");
    const name = aliases[path] ?? aliases[root] ?? path;
    if (!fields.includes(name)) {
      general = true;
      continue;
    }
    fieldErrors[name] ??= ["origin", "destination"].includes(name)
      ? { code: "LOCATION" }
      : name === "email"
        ? { code: "EMAIL" }
        : issueCode(issue);
  }
  return {
    error: general || !Object.keys(fieldErrors).length ? "INVALID_INPUT" : "",
    success: false,
    fieldErrors,
  };
}
export function fieldFailure(name: string, code: string): FormOutcome {
  return { error: "", success: false, fieldErrors: { [name]: { code } } };
}
export function measurementFailure(code: string): FormOutcome {
  const names: Record<string, string> = {
    MOVE_START_REQUIRED: "start",
    MOVE_START_INVALID: "start",
    MOVE_END_REQUIRED: "end",
    MOVE_END_INVALID: "end",
    MOVE_MILES_REQUIRED: "miles",
    MOVE_MILES_INVALID: "miles",
  };
  const name = names[code];
  return name ? fieldFailure(name, code) : { error: code, success: false };
}
export const contactFields = ["full_name", "phone", "email"] as const;
export const requestFields = [
  ...contactFields,
  "origin",
  "destination",
  "origin.unit",
  "destination.unit",
  "origin_county",
  "destination_county",
  "territorial_reviewed",
  "moving_date",
  "property_type",
  "bedrooms",
  "property_size",
  "size_unit",
  "origin_floor",
  "destination_floor",
  "origin_elevator",
  "destination_elevator",
  "workers",
  "comments",
];
export const requestAliases = {
  origin: "origin",
  destination: "destination",
  "origin.unit": "origin.unit",
  "destination.unit": "destination.unit",
};
export const newRequestFields = [
  ...contactFields,
  "origin",
  "destination",
  "moving_date",
  "move_size",
  "comments",
];
export const newRequestAliases = { origin_location: "origin", destination_location: "destination" };
