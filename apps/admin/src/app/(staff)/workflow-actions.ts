"use server";
import { requireStaff } from "@lm/data/server";
import {
  dollarsToCents,
  fieldFailure,
  measurementFailure,
  miamiInstant,
  quoteSchema,
  validateMeasurements,
  validationFailure,
} from "@lm/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormResult } from "@/components/record-ui";

const identity = z.object({
  request: z.uuid(),
  version: z.coerce.number().int().min(0),
});
const text = (f: FormData, name: string) => String(f.get(name) ?? "");
function response(error: { message: string } | null): FormResult {
  if (!error) {
    revalidatePath("/", "layout");
    return { error: "", success: true };
  }
  return {
    error:
      ["ROUTE_REVIEW_REQUIRED", "CONFLICT", "FORBIDDEN", "INVALID_INPUT", "INVALID_TRANSITION"].find((c) =>
        error.message.includes(c),
      ) ?? "UNAVAILABLE",
    success: false,
  };
}
const invalid: FormResult = { error: "INVALID_INPUT", success: false };
export async function saveQuote(_previous: FormResult, form: FormData): Promise<FormResult> {
  const { db } = await requireStaff("quotes.edit");
  const id = identity.safeParse(Object.fromEntries(form));
  let rate = Number.NaN;
  try {
    rate = dollarsToCents(text(form, "rate"));
  } catch {
    // Continue parsing so quantity and other field errors are returned together.
  }
  const data = quoteSchema.safeParse({
    mode: text(form, "mode"),
    workers: Number(text(form, "workers")),
    rate_cents: rate,
    estimated_quantity: Number(text(form, "quantity")),
  });
  if (!id.success) return invalid;
  if (!data.success) {
    const failure = validationFailure(data.error, ["mode", "workers", "rate", "quantity"], {
      rate_cents: "rate",
      estimated_quantity: "quantity",
    });
    if (failure.fieldErrors?.rate) failure.fieldErrors.rate = { code: "MONEY" };
    return failure;
  }
  return response(
    (
      await db.rpc("save_quote", {
        p_request: id.data.request,
        p_version: id.data.version,
        p_mode: data.data.mode,
        p_workers: data.data.workers,
        p_rate: rate,
        p_quantity: data.data.estimated_quantity,
      })
    ).error,
  );
}
export async function quoteAction(_previous: FormResult, form: FormData): Promise<FormResult> {
  const id = identity.safeParse(Object.fromEntries(form));
  const action = text(form, "action");
  if (!id.success || !["approve", "reopen"].includes(action)) return invalid;
  const { db } = await requireStaff(action === "approve" ? "quotes.approve" : "quotes.edit");
  return response(
    (
      await db.rpc(action === "approve" ? "approve_quote" : "reopen_quote", {
        p_request: id.data.request,
        p_version: id.data.version,
      })
    ).error,
  );
}
export async function communicateQuote(_previous: FormResult, form: FormData): Promise<FormResult> {
  const { db } = await requireStaff("quotes.confirm");
  const id = identity.safeParse(Object.fromEntries(form));
  const medium = z.enum(["PHONE", "WHATSAPP", "EMAIL"]).safeParse(text(form, "medium"));
  if (!id.success) return invalid;
  if (!medium.success) return fieldFailure("medium", "CHOICE");
  if (text(form, "response").length > 2000)
    return {
      ...fieldFailure("response", "MAX_LENGTH"),
      fieldErrors: { response: { code: "MAX_LENGTH", limit: 2000 } },
    };
  if (form.get("confirm") === "on" && !text(form, "response").trim())
    return fieldFailure("response", "REQUIRED");
  let at: string;
  try {
    at = miamiInstant(text(form, "at"), text(form, "at_offset"));
  } catch {
    return fieldFailure("at", "DATE_INVALID");
  }
  if (Date.parse(at) > Date.now()) return fieldFailure("at", "DATE_FUTURE");
  const responseControl: FormResult = response(
    (
      await db.rpc("communicate_quote", {
        p_request: id.data.request,
        p_version: id.data.version,
        p_medium: medium.data,
        p_at: at,
        p_response: text(form, "response"),
        p_confirm: form.get("confirm") === "on",
      })
    ).error,
  );
  return responseControl;
}
export async function scheduleMove(_previous: FormResult, form: FormData): Promise<FormResult> {
  const { db } = await requireStaff("moves.schedule");
  const id = identity
    .extend({
      duration: z.coerce.number().int().min(1).max(10080),
      notes: z.string().max(4000),
    })
    .safeParse(Object.fromEntries(form));
  if (!id.success) return validationFailure(id.error, ["duration", "notes"]);
  let at: string;
  try {
    at = miamiInstant(text(form, "at"), text(form, "at_offset"));
  } catch {
    return fieldFailure("at", "DATE_INVALID");
  }
  if (Date.parse(at) <= Date.now()) return fieldFailure("at", "DATE_AFTER_NOW");
  if (
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" }).format(
      new Date(at),
    ) === "Sun"
  )
    return fieldFailure("at", "DATE_SUNDAY");
  return response(
    (
      await db.rpc("schedule_move", {
        p_request: id.data.request,
        p_version: id.data.version,
        p_at: at,
        p_duration: id.data.duration,
        p_notes: id.data.notes,
      })
    ).error,
  );
}
export async function recordMove(_previous: FormResult, form: FormData): Promise<FormResult> {
  const { db } = await requireStaff("moves.operate");
  const id = identity.safeParse(Object.fromEntries(form));
  const action = z.enum(["start", "save", "complete", "correct"]).safeParse(text(form, "action"));
  if (!id.success || !action.success) return invalid;
  const { data: quote, error: quoteError } = await db
    .from("quotes")
    .select("mode")
    .eq("request_id", id.data.request)
    .single();
  if (quoteError || !quote) return { error: "UNAVAILABLE", success: false };
  const measurement = validateMeasurements(
    {
      start: text(form, "start"),
      start_offset: text(form, "start_offset"),
      end: text(form, "end"),
      end_offset: text(form, "end_offset"),
      miles: text(form, "miles"),
    },
    action.data,
    quote.mode,
  );
  if (measurement.error) return measurementFailure(measurement.error);
  return response(
    (
      await db.rpc("record_move", {
        p_request: id.data.request,
        p_version: id.data.version,
        p_action: action.data,
        p_start: measurement.start,
        p_end: measurement.end,
        p_miles: measurement.miles,
      })
    ).error,
  );
}
