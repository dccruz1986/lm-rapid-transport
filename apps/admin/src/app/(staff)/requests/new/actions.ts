"use server";
import { requireStaff } from "@lm/data/server";
import { adminRequestSchema } from "@lm/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createRequest(input: unknown) {
  const { db } = await requireStaff("requests.create");
  const parsed = adminRequestSchema.safeParse(input);
  if (!parsed.success)
    return { error: "INVALID_INPUT", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  const { key, ...payload } = parsed.data;
  const { data, error } = await db.rpc("create_request", { p_key: key, p_data: payload });
  if (error)
    return {
      error:
        ["CONFLICT", "INVALID_DATE", "FORBIDDEN", "INVALID_INPUT"].find((code) =>
          error.message.includes(code),
        ) ?? "UNAVAILABLE",
      fields: [],
    };
  const receipt = z.object({ id: z.uuid(), request_number: z.string() }).safeParse(data);
  if (!receipt.success) return { error: "UNAVAILABLE", fields: [] };
  revalidatePath("/requests");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { error: "", fields: [], ...receipt.data };
}
