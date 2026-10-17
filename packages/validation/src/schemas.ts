import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { z } from "zod";
import { miamiDate } from "./index";
export const phoneSchema = z
  .string()
  .max(40)
  .transform((value, ctx) => {
    const phone = parsePhoneNumberFromString(value, "US");
    if (!phone?.isValid() || phone.country !== "US") {
      ctx.addIssue({ code: "custom", message: "PHONE_US" });
      return z.NEVER;
    }
    return phone.number;
  });
export const emailSchema = z.union([z.email().max(254), z.literal(""), z.null()]).transform((v) => v || null);
export const addressSchema = z
  .object({
    street: z.string().trim().min(3).max(200),
    unit: z.string().trim().max(40),
    city: z.string().trim().min(2).max(100),
    state: z.literal("FL"),
    postal_code: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.literal("US"),
  })
  .strict();
export const contactSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  phone: phoneSchema,
  email: emailSchema,
});
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value,
    "DATE_INVALID",
  );
export const requestBaseSchema = contactSchema
  .extend({
    origin: addressSchema,
    destination: addressSchema,
    moving_date: dateSchema.nullable(),
    property_type: z.enum(["HOUSE", "APARTMENT", "OFFICE", "COMMERCIAL"]),
    bedrooms: z.number().int().min(0).max(20).nullable(),
    property_size: z.number().positive().max(1000000).nullable(),
    size_unit: z.enum(["SQFT", "SQM"]).nullable(),
    origin_floor: z.number().int().min(-5).max(150),
    destination_floor: z.number().int().min(-5).max(150),
    origin_elevator: z.boolean(),
    destination_elevator: z.boolean(),
    workers: z.union([z.literal(2), z.literal(3), z.literal(4)]).nullable(),
    comments: z.string().max(4000),
  })
  .strict();
function propertyRules(data: z.infer<typeof requestBaseSchema>, ctx: z.RefinementCtx) {
  if (["HOUSE", "APARTMENT"].includes(data.property_type) && data.bedrooms === null)
    ctx.addIssue({ code: "custom", path: ["bedrooms"], message: "BEDROOMS_REQUIRED" });
  if (["OFFICE", "COMMERCIAL"].includes(data.property_type) && data.bedrooms !== null)
    ctx.addIssue({ code: "custom", path: ["bedrooms"], message: "BEDROOMS_COMMERCIAL" });
  if ((data.property_size === null) !== (data.size_unit === null))
    ctx.addIssue({ code: "custom", path: ["property_size"], message: "SIZE_UNIT_REQUIRED" });
}
export const requestEditSchema = requestBaseSchema.superRefine(propertyRules);
export const requestSchema = requestBaseSchema.superRefine((data, ctx) => {
  propertyRules(data, ctx);
  if (data.moving_date) {
    if (data.moving_date <= miamiDate())
      ctx.addIssue({ code: "custom", path: ["moving_date"], message: "DATE_TOMORROW" });
    if (new Date(`${data.moving_date}T12:00:00Z`).getUTCDay() === 0)
      ctx.addIssue({ code: "custom", path: ["moving_date"], message: "DATE_SUNDAY" });
  }
});
export type RequestInput = z.infer<typeof requestSchema>;
export const intakeStartSchema = z
  .object({ key: z.uuid(), data: requestSchema, website: z.literal("") })
  .strict();
export const quoteSchema = z
  .object({
    mode: z.enum(["LOCAL", "PER_MILE"]),
    workers: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    rate_cents: z.number().int().min(1).max(10000000),
    estimated_quantity: z.number().positive().max(10000),
  })
  .strict()
  .refine((v) => v.mode !== "LOCAL" || v.estimated_quantity <= 168, {
    path: ["estimated_quantity"],
    message: "DURATION_LIMIT",
  });
export const pricingSchema = z
  .object({
    hourly_two: z.number().int().min(1).max(10000000),
    hourly_three: z.number().int().min(1).max(10000000),
    hourly_four: z.number().int().min(1).max(10000000),
    per_mile: z.number().int().min(1).max(10000000),
    minimum_hours: z.number().int().min(1).max(24),
  })
  .strict();
export const FILE_LIMIT = 5 * 1024 * 1024;
export const FILE_COUNT_LIMIT = 8;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export function validFileMetadata(file: { size: number; type: string }) {
  return (
    file.size > 0 && file.size <= FILE_LIMIT && (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)
  );
}
export function dollarsToCents(value: string) {
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) throw new Error("INVALID_MONEY");
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents < 1 || cents > 10000000) throw new Error("INVALID_MONEY");
  return cents;
}
