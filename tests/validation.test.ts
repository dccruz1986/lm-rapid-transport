import { describe, expect, test } from "bun:test";
import {
  canTransitionMove,
  canTransitionRequest,
  phoneSchema,
  requestSchema,
  validFileMetadata,
} from "@lm/validation";

const address = {
  street: "100 Example Street",
  unit: "",
  city: "Miami",
  state: "FL",
  postal_code: "33130",
  country: "US",
};
const sample = {
  first_name: "Test",
  last_name: "Example",
  phone: "3055550101",
  email: "",
  origin: address,
  destination: address,
  moving_date: null,
  property_type: "APARTMENT",
  bedrooms: 2,
  property_size: null,
  size_unit: null,
  origin_floor: 1,
  destination_floor: 0,
  origin_elevator: true,
  destination_elevator: false,
  workers: null,
  comments: "",
};
describe("intake", () => {
  test("accepts no email, no date and undecided crew", () => {
    const parsed = requestSchema.parse(sample);
    expect(parsed.email).toBeNull();
    expect(parsed.phone).toBe("+13055550101");
  });
  test("rejects Canadian +1 and foreign phones", () => {
    expect(phoneSchema.safeParse("+14165550101").success).toBe(false);
    expect(phoneSchema.safeParse("+442079460000").success).toBe(false);
  });
  test("requires residential bedrooms, not commercial", () => {
    expect(requestSchema.safeParse({ ...sample, bedrooms: null }).success).toBe(false);
    expect(requestSchema.safeParse({ ...sample, property_type: "OFFICE", bedrooms: null }).success).toBe(
      true,
    );
  });
  test("does not accept extra financial fields or non-Florida destinations", () => {
    expect(requestSchema.safeParse({ ...sample, discount: 100 }).success).toBe(false);
    expect(requestSchema.safeParse({ ...sample, destination: { ...address, state: "GA" } }).success).toBe(
      false,
    );
  });
  test("rejects oversized images and unsupported types", () => {
    expect(validFileMetadata({ size: 5242881, type: "image/jpeg" })).toBe(false);
    expect(validFileMetadata({ size: 100, type: "image/svg+xml" })).toBe(false);
  });
});
test("cancelled records must be reviewed, completed jobs cannot be reopened", () => {
  expect(canTransitionMove("CANCELLED", "SCHEDULED")).toBe(false);
  expect(canTransitionRequest("CANCELLED", "PENDING_REVIEW")).toBe(true);
  expect(canTransitionMove("COMPLETED", "IN_PROGRESS")).toBe(false);
});
