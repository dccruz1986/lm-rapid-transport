import { expect, test } from "bun:test";
import { adminRequestSchema, miamiDate } from "@lm/validation";

const input = {
  key: "91000000-0000-4000-8000-000000000001",
  full_name: "María del Carmen",
  phone: "3055550198",
  email: "",
  origin: "33147",
  destination: "33016",
  move_size: "STUDIO",
  moving_date: null,
  comments: "",
};
test("manual request normalizes US phone and optional email", () => {
  const result = adminRequestSchema.parse(input);
  expect(result.phone).toBe("+13055550198");
  expect(result.email).toBeNull();
  expect(result.full_name).toBe(input.full_name);
  expect(result.origin).toBe("33147");
});
test("invalid contact, location, date and pricing injection are rejected", () => {
  for (const patch of [
    { phone: "123" },
    { email: "wrong" },
    { origin: "" },
    { full_name: " " },
    { move_size: "UNKNOWN" },
    { moving_date: miamiDate() },
    { moving_date: "2027-02-30" },
    { moving_date: "2099-11-01" },
    { suggested_mode: "LOCAL" },
  ]) {
    expect(adminRequestSchema.safeParse({ ...input, ...patch }).success).toBe(false);
  }
});
