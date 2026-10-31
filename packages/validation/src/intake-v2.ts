import { z } from "zod";
import { miamiDate } from "./index";
import { emailSchema, phoneSchema, requestBaseSchema, requestSchema } from "./schemas";

export const moveSizes = [
  "STUDIO",
  "BEDROOMS_1",
  "BEDROOMS_2",
  "BEDROOMS_3",
  "BEDROOMS_4",
  "BEDROOMS_5_PLUS",
  "OFFICE",
  "COMMERCIAL",
] as const;
export const partialLocationSchema = z
  .object({
    input: z.string().trim().min(3).max(300),
    resolution_token: z.string().max(8000).nullable(),
  })
  .strict();
export const fullContactSchema = z.object({
  full_name: z.string().trim().min(1).max(160),
  phone: phoneSchema,
  email: emailSchema,
});
export const intakeV2Schema = fullContactSchema
  .extend({
    version: z.literal(2),
    origin: partialLocationSchema,
    destination: partialLocationSchema,
    move_size: z.enum(moveSizes),
    moving_date: requestBaseSchema.shape.moving_date,
    comments: requestBaseSchema.shape.comments,
    workers: requestBaseSchema.shape.workers,
    property_size: requestBaseSchema.shape.property_size,
    size_unit: requestBaseSchema.shape.size_unit,
    property_type: requestBaseSchema.shape.property_type.nullable(),
    origin_floor: requestBaseSchema.shape.origin_floor.nullable(),
    destination_floor: requestBaseSchema.shape.destination_floor.nullable(),
    origin_elevator: z.boolean().nullable(),
    destination_elevator: z.boolean().nullable(),
    origin_unit: z.string().max(40).nullable(),
    destination_unit: z.string().max(40).nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.moving_date) {
      if (data.moving_date <= miamiDate())
        ctx.addIssue({ code: "custom", path: ["moving_date"], message: "DATE_TOMORROW" });
      if (new Date(data.moving_date + "T12:00:00Z").getUTCDay() === 0)
        ctx.addIssue({ code: "custom", path: ["moving_date"], message: "DATE_SUNDAY" });
    }
    if ((data.property_size === null) !== (data.size_unit === null))
      ctx.addIssue({ code: "custom", path: ["property_size"], message: "SIZE_UNIT_REQUIRED" });
    if (
      data.property_type &&
      ((["OFFICE", "COMMERCIAL"].includes(data.move_size) && data.property_type !== data.move_size) ||
        (!["OFFICE", "COMMERCIAL"].includes(data.move_size) &&
          !["HOUSE", "APARTMENT"].includes(data.property_type)))
    )
      ctx.addIssue({ code: "custom", path: ["property_type"], message: "PROPERTY_SIZE_MISMATCH" });
  });
export type IntakeV2 = z.infer<typeof intakeV2Schema>;
export const publicIntakeSchema = z
  .object({ key: z.uuid(), website: z.literal(""), data: z.union([intakeV2Schema, requestSchema]) })
  .strict();
export function displayName(value: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}) {
  return value.full_name || [value.first_name, value.last_name].filter(Boolean).join(" ");
}
export const operationalEditSchema = requestBaseSchema
  .omit({ first_name: true, last_name: true })
  .extend({
    full_name: fullContactSchema.shape.full_name,
    property_type: requestBaseSchema.shape.property_type.nullable(),
    origin_floor: requestBaseSchema.shape.origin_floor.nullable(),
    destination_floor: requestBaseSchema.shape.destination_floor.nullable(),
    origin_elevator: z.boolean().nullable(),
    destination_elevator: z.boolean().nullable(),
    origin_county: z.enum(["MIAMI_DADE", "OTHER_FL"]),
    destination_county: z.enum(["MIAMI_DADE", "OTHER_FL"]),
    territorial_reviewed: z.literal(true),
  })
  .strict();

export const locationQuerySchema = z
  .object({
    action: z.enum(["suggest", "resolve"]),
    input: z.string().trim().min(3).max(300),
    session: z.uuid(),
    language: z.enum(["es", "en"]),
    id: z.string().min(1).max(300).optional(),
  })
  .strict();
