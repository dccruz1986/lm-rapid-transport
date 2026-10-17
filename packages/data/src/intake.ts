import "server-only";
import { createHash, createHmac } from "node:crypto";
import { appUrl } from "@lm/config/env";
import { FILE_LIMIT, intakeStartSchema } from "@lm/validation";
import sharp from "sharp";
import { privilegedClient } from "./privileged";

export class IntakeError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function secret() {
  const value = process.env.INTAKE_HASH_SECRET;
  if (!value || value.length < 32) throw new IntakeError("UNAVAILABLE", 503);
  return value;
}
export async function intakeGuard(request: Request, purpose: "begin" | "upload" | "finish") {
  if (request.headers.get("origin") !== new URL(appUrl("web")).origin) throw new IntakeError("ORIGIN", 403);
  const db = privilegedClient();
  const limits: Array<[string, number]> = [[`global:${purpose}`, purpose === "begin" ? 300 : 2400]];
  const header = process.env.TRUSTED_IP_HEADER;
  if (header) {
    const ip = request.headers.get(header);
    if (!ip || ip.length > 100) throw new IntakeError("ORIGIN", 403);
    limits.push([
      `ip:${purpose}:${createHmac("sha256", secret()).update(ip).digest("hex")}`,
      purpose === "begin" ? 10 : 100,
    ]);
  }
  for (const [key, limit] of limits) {
    const { data, error } = await db.rpc("intake_quota", { p_key: key, p_limit: limit, p_seconds: 3600 });
    if (error) throw new IntakeError("UNAVAILABLE", 503);
    if (!data) throw new IntakeError("RATE_LIMIT", 429);
  }
}
export async function limitedBody(request: Request, max: number) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > max) throw new IntakeError("TOO_LARGE", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new IntakeError("INVALID_INPUT");
  const chunks: Uint8Array[] = [];
  let size = 0;
  const timeout = setTimeout(() => void reader.cancel(), 30_000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw new IntakeError("TOO_LARGE", 413);
      }
      chunks.push(value);
    }
  } finally {
    clearTimeout(timeout);
  }
  return Buffer.concat(chunks);
}
function tokenHash(request: Request) {
  const token = request.headers.get("x-intake-token") ?? "";
  if (!/^[a-f0-9]{64}$/.test(token)) throw new IntakeError("EXPIRED", 403);
  return hash(token);
}
function fail(error: { message: string } | null) {
  if (!error) return;
  if (error.message.includes("CONFLICT")) throw new IntakeError("CONFLICT", 409);
  if (error.message.includes("FILES_PENDING")) throw new IntakeError("FILES_PENDING", 409);
  if (error.message.includes("INVALID_DATE")) throw new IntakeError("INVALID_DATE");
  if (error.message.includes("FILE_LIMIT")) throw new IntakeError("FILE_LIMIT");
  if (error.message.includes("EXPIRED") || error.message.includes("no rows"))
    throw new IntakeError("EXPIRED", 410);
  throw new IntakeError("UNAVAILABLE", 503);
}
export async function beginIntake(request: Request) {
  await intakeGuard(request, "begin");
  let body: unknown;
  try {
    body = JSON.parse((await limitedBody(request, 20_000)).toString());
  } catch (error) {
    if (error instanceof IntakeError) throw error;
    throw new IntakeError("INVALID_INPUT");
  }
  const parsed = intakeStartSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: "INVALID_INPUT", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 400 },
    );
  const token = createHmac("sha256", secret()).update(parsed.data.key).digest("hex");
  const { error } = await privilegedClient().rpc("intake_begin", {
    p_key: parsed.data.key,
    p_hash: hash(token),
    p_data: parsed.data.data,
  });
  fail(error);
  return Response.json({ token }, { headers: { "Cache-Control": "no-store" } });
}
export async function uploadIntake(request: Request) {
  await intakeGuard(request, "upload");
  const p_hash = tokenHash(request);
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new IntakeError("INVALID_INPUT");
  const name = (url.searchParams.get("name") ?? "photo").replace(/[^\p{L}\p{N} ._-]/gu, "_").slice(0, 120);
  const input = await limitedBody(request, FILE_LIMIT);
  let bytes: Buffer;
  let mime: string;
  try {
    const image = sharp(input, { limitInputPixels: 20_000_000, failOn: "warning", animated: false });
    const metadata = await image.metadata();
    const formats: Record<string, { mime: string; extensions: RegExp }> = {
      jpeg: { mime: "image/jpeg", extensions: /\.jpe?g$/i },
      png: { mime: "image/png", extensions: /\.png$/i },
      webp: { mime: "image/webp", extensions: /\.webp$/i },
    };
    const format = formats[metadata.format ?? ""];
    if (
      !format?.extensions.test(name) ||
      request.headers.get("content-type") !== format.mime ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error("format");
    mime = format.mime;
    bytes = await image.rotate().toBuffer();
    if (bytes.length > FILE_LIMIT) throw new Error("size");
  } catch {
    throw new IntakeError("INVALID_FILE");
  }
  const db = privilegedClient();
  const reserved = await db.rpc("intake_file", {
    p_hash,
    p_id: id,
    p_action: "reserve",
    p_name: name,
    p_mime: mime,
    p_size: bytes.length,
  });
  fail(reserved.error);
  if (!reserved.data) throw new IntakeError("UNAVAILABLE", 503);
  const path = reserved.data;
  const uploaded = await db.storage
    .from("request-photos")
    .upload(path, bytes, { contentType: mime, upsert: false });
  // A retry can find its previous successful upload before metadata was marked ready.
  if (uploaded.error && !("statusCode" in uploaded.error && String(uploaded.error.statusCode) === "409")) {
    throw new IntakeError("UPLOAD_FAILED", 503);
  }
  const ready = await db.rpc("intake_file", { p_hash, p_id: id, p_action: "ready" });
  if (ready.error) {
    // Another request may already have finalized this path. Leave cleanup to
    // the session-aware maintenance job, which excludes committed attachments.
    fail(ready.error);
  }
  return Response.json({ id }, { headers: { "Cache-Control": "no-store" } });
}
export async function removeIntakeFile(request: Request) {
  await intakeGuard(request, "upload");
  const p_hash = tokenHash(request);
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new IntakeError("INVALID_INPUT");
  const db = privilegedClient();
  const file = await db.rpc("intake_file", { p_hash, p_id: id, p_action: "get" });
  if (file.error?.message.includes("FILE_NOT_FOUND")) return Response.json({ ok: true });
  fail(file.error);
  if (file.data) {
    const { error } = await db.storage.from("request-photos").remove([file.data]);
    if (error) throw new IntakeError("UPLOAD_FAILED", 503);
    fail((await db.rpc("intake_file", { p_hash, p_id: id, p_action: "remove" })).error);
  }
  return Response.json({ ok: true });
}
export async function finalizeIntake(request: Request) {
  await intakeGuard(request, "finish");
  const { data, error } = await privilegedClient().rpc("intake_finalize", { p_hash: tokenHash(request) });
  fail(error);
  if (!data) throw new IntakeError("UNAVAILABLE", 503);
  return Response.json({ request_number: data }, { headers: { "Cache-Control": "no-store" } });
}
export function intakeRoute(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      const known = error instanceof IntakeError;
      return Response.json(
        { error: known ? error.code : "UNAVAILABLE" },
        { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}
