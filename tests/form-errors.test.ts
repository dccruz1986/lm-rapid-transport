import { describe, expect, test } from "bun:test";
import {
  fullContactSchema,
  measurementFailure,
  quoteSchema,
  requestBaseSchema,
  validationFailure,
} from "@lm/validation";
import { fieldMessage } from "../packages/ui/src/field-message";

describe("safe field errors", () => {
  test("returns multiple mapped quote errors in input units", () => {
    const parsed = quoteSchema.safeParse({
      mode: "LOCAL",
      workers: 2,
      rate_cents: NaN,
      estimated_quantity: -1,
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const result = validationFailure(parsed.error, ["rate", "quantity"], {
      rate_cents: "rate",
      estimated_quantity: "quantity",
    });
    expect(result.error).toBe("");
    expect(Object.keys(result.fieldErrors ?? {})).toEqual(["rate", "quantity"]);
    expect(result.fieldErrors?.quantity?.code).toBe("ABOVE_VALUE");
  });
  test("unknown identities remain general alongside editable errors", () => {
    const parsed = fullContactSchema.safeParse({ full_name: "", phone: "secret", email: "bad" });
    if (parsed.success) throw new Error("Expected validation failure");
    const result = validationFailure(parsed.error, ["email"]);
    expect(result.error).toBe("INVALID_INPUT");
    expect(Object.keys(result.fieldErrors ?? {})).toEqual(["email"]);
    expect(JSON.stringify(result)).not.toContain("secret");
  });
  test("composite addresses map to their visible control", () => {
    const parsed = requestBaseSchema.pick({ origin: true }).safeParse({
      origin: {
        street: "123 Main Street",
        unit: "",
        city: "",
        state: "FL",
        postal_code: "33147",
        country: "US",
      },
    });
    if (parsed.success) throw new Error("Expected validation failure");
    expect(validationFailure(parsed.error, ["origin"], { origin: "origin" }).fieldErrors?.origin).toEqual({
      code: "LOCATION",
    });
  });
  test("cross-field measurements target finish; opaque failures stay general", () => {
    expect(measurementFailure("MOVE_END_INVALID").fieldErrors).toEqual({ end: { code: "MOVE_END_INVALID" } });
    expect(measurementFailure("CONFLICT")).toEqual({ error: "CONFLICT", success: false });
    expect(measurementFailure("MOVE_END_UNKNOWN")).toEqual({ error: "MOVE_END_UNKNOWN", success: false });
  });
  test("messages translate limits and never reveal unknown codes", () => {
    expect(fieldMessage({ code: "MIN_LENGTH", limit: 12 }, "es")).toContain("12 caracteres");
    expect(fieldMessage({ code: "MIN_LENGTH", limit: 12 }, "en")).toContain("12 characters");
    expect(fieldMessage({ code: "SQL secret" }, "es")).toBe("Introduce un valor válido.");
  });
});
