"use server";
import { requireStaff } from "@lm/data/server";
import { fullContactSchema, operationalEditSchema } from "@lm/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormResult } from "@/components/record-ui";

function result(error: { message: string; code?: string } | null): FormResult {
  if (!error) return { error: "", success: true };
  if (error.code === "23505") return { error: "PHONE_CONFLICT", success: false };
  const code = [
    "PHONE_CONFLICT",
    "CONFLICT",
    "REVIEW_QUOTE_FIRST",
    "FORBIDDEN",
    "INVALID_TRANSITION",
    "INVALID_INPUT",
  ].find((c) => error.message.includes(c));
  return { error: code ?? "UNAVAILABLE", success: false };
}
function refresh() {
  revalidatePath("/", "layout");
}
const identity = z.object({ id: z.uuid(), version: z.coerce.number().int().positive() });
export async function changeRequest(_previous: FormResult, form: FormData): Promise<FormResult> {
  const parsed = identity
    .extend({ action: z.enum(["contact", "cancel", "reactivate"]), reason: z.string().max(1000).default("") })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "INVALID_INPUT", success: false };
  const { db } = await requireStaff(
    parsed.data.action === "cancel"
      ? "records.cancel"
      : parsed.data.action === "reactivate"
        ? "records.reactivate"
        : "requests.edit",
  );
  const { error } = await db.rpc("request_action", {
    p_id: parsed.data.id,
    p_version: parsed.data.version,
    p_action: parsed.data.action,
    p_reason: parsed.data.reason,
  });
  if (!error) refresh();
  return result(error);
}
export async function saveNote(_previous: FormResult, form: FormData): Promise<FormResult> {
  const parsed = z
    .object({
      request: z.uuid(),
      id: z.union([z.uuid(), z.literal("")]),
      body: z.string().max(4000),
      action: z.enum(["save", "delete"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "INVALID_INPUT", success: false };
  const { db } = await requireStaff("notes.manage");
  const { error } = await db.rpc("save_note", {
    p_request: parsed.data.request,
    ...(parsed.data.id ? { p_id: parsed.data.id } : {}),
    p_body: parsed.data.body,
    p_delete: parsed.data.action === "delete",
  });
  if (!error) refresh();
  return result(error);
}
export async function editCustomer(_previous: FormResult, form: FormData): Promise<FormResult> {
  const id = identity.safeParse(Object.fromEntries(form));
  const contact = fullContactSchema.safeParse(Object.fromEntries(form));
  if (!id.success || !contact.success) return { error: "INVALID_INPUT", success: false };
  const { db } = await requireStaff("requests.edit");
  const { error } = await db.rpc("edit_customer_name", {
    p_id: id.data.id,
    p_version: id.data.version,
    p_name: contact.data.full_name,
    p_phone: contact.data.phone,
    p_email: contact.data.email ?? "",
  });
  if (!error) refresh();
  return result(error);
}
export async function editRequest(_previous: FormResult, form: FormData): Promise<FormResult> {
  const id = identity.safeParse(Object.fromEntries(form));
  const text = (key: string) => String(form.get(key) ?? "");
  const optionalNumber = (key: string) => (text(key) === "" ? null : Number(text(key)));
  const address = (key: string) => ({
    street: text(`${key}.street`),
    unit: text(`${key}.unit`),
    city: text(`${key}.city`),
    state: "FL",
    postal_code: text(`${key}.postal_code`),
    country: "US",
  });
  const parsed = operationalEditSchema.safeParse({
    full_name: text("full_name"),
    origin_county: text("origin_county"),
    destination_county: text("destination_county"),
    territorial_reviewed: text("territorial_reviewed") === "on",
    phone: text("phone"),
    email: text("email"),
    origin: address("origin"),
    destination: address("destination"),
    moving_date: text("moving_date") || null,
    property_type: text("property_type") || null,
    bedrooms: ["HOUSE", "APARTMENT"].includes(text("property_type")) ? optionalNumber("bedrooms") : null,
    property_size: optionalNumber("property_size"),
    size_unit: text("property_size") ? text("size_unit") : null,
    origin_floor: optionalNumber("origin_floor"),
    destination_floor: optionalNumber("destination_floor"),
    origin_elevator: text("origin_elevator") === "" ? null : text("origin_elevator") === "true",
    destination_elevator:
      text("destination_elevator") === "" ? null : text("destination_elevator") === "true",
    workers: optionalNumber("workers"),
    comments: text("comments"),
  });
  if (!id.success || !parsed.success) return { error: "INVALID_INPUT", success: false };
  const { db } = await requireStaff("requests.edit");
  const { error } = await db.rpc("edit_request", {
    p_id: id.data.id,
    p_version: id.data.version,
    p_data: parsed.data,
  });
  if (!error) refresh();
  return result(error);
}
