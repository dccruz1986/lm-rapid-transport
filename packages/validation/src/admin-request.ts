import { z } from "zod";
import { miamiDate } from "./index";
import { fullContactSchema, moveSizes } from "./intake-v2";
import { requestBaseSchema } from "./schemas";
export const selectedLocationSchema = z
  .object({
    label: z.string().max(300),
    street: z.string().max(200),
    city: z.string().max(100),
    postal_code: z.string().regex(/^(\d{5}(-\d{4})?)?$/),
    place_id: z.string().min(1).max(300),
    precision: z.enum(["ADDRESS", "POSTAL_CODE"]),
  })
  .strict();

export const adminRequestSchema = fullContactSchema
  .extend({
    key: z.uuid(),
    origin: z.string().trim().min(3).max(300),
    destination: z.string().trim().min(3).max(300),
    origin_location: selectedLocationSchema.nullable().optional(),
    destination_location: selectedLocationSchema.nullable().optional(),
    move_size: z.enum(moveSizes),
    moving_date: requestBaseSchema.shape.moving_date,
    comments: requestBaseSchema.shape.comments,
  })
  .strict()
  .superRefine((data, ctx) => {
    for (const side of ["origin", "destination"] as const) {
      const selected = data[`${side}_location`];
      if (selected && selected.label !== data[side])
        ctx.addIssue({ code: "custom", path: [side], message: "LOCATION_MISMATCH" });
    }
    if (
      data.moving_date &&
      (data.moving_date <= miamiDate() || new Date(`${data.moving_date}T12:00:00Z`).getUTCDay() === 0)
    ) {
      ctx.addIssue({ code: "custom", path: ["moving_date"], message: "INVALID_DATE" });
    }
  });
export type AdminRequestInput = z.infer<typeof adminRequestSchema>;
