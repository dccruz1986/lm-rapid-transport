"use server";
import { requireStaff } from "@lm/data/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormResult } from "@/components/record-ui";

const money = z
  .string()
  .regex(/^\d{1,6}(\.\d{1,2})?$/)
  .transform((v) => Math.round(Number(v) * 100))
  .pipe(z.number().int().min(1).max(10000000));
const schema = z.object({
  version: z.coerce.number().int().positive(),
  hourly_two: money,
  hourly_three: money,
  hourly_four: money,
  per_mile: money,
  minimum_hours: z.coerce.number().int().min(1).max(24),
});
export async function savePricing(_previous: FormResult, form: FormData): Promise<FormResult> {
  const { db } = await requireStaff("pricing.manage");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "INVALID_INPUT", success: false };
  const p = parsed.data;
  const { error } = await db.rpc("update_pricing_settings", {
    p_version: p.version,
    p_two: p.hourly_two,
    p_three: p.hourly_three,
    p_four: p.hourly_four,
    p_mile: p.per_mile,
    p_minimum: p.minimum_hours,
  });
  if (error)
    return { error: error.message.includes("CONFLICT") ? "CONFLICT" : "UNAVAILABLE", success: false };
  revalidatePath("/settings");
  return { error: "", success: true };
}
