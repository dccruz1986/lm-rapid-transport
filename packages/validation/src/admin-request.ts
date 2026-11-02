import { z } from "zod";
import { miamiDate } from "./index";
import { fullContactSchema, moveSizes } from "./intake-v2";
import { requestBaseSchema } from "./schemas";

export const adminRequestSchema = fullContactSchema
  .extend({
    key: z.uuid(),
    origin: z.string().trim().min(3).max(300),
    destination: z.string().trim().min(3).max(300),
    move_size: z.enum(moveSizes),
    moving_date: requestBaseSchema.shape.moving_date,
    comments: requestBaseSchema.shape.comments,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.moving_date &&
      (data.moving_date <= miamiDate() || new Date(`${data.moving_date}T12:00:00Z`).getUTCDay() === 0)
    ) {
      ctx.addIssue({ code: "custom", path: ["moving_date"], message: "INVALID_DATE" });
    }
  });
export type AdminRequestInput = z.infer<typeof adminRequestSchema>;
