import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { IntakeV2 } from "@lm/validation";
import { locationQuerySchema as query } from "@lm/validation";
import { IntakeError, intakeGuard, limitedBody } from "./intake";
import { classifyLocations, googleProvider, LocationError, type Resolution } from "./location-provider";

function secret() {
  const s = process.env.INTAKE_HASH_SECRET;
  if (!s || s.length < 32) throw new IntakeError("UNAVAILABLE", 503);
  return s;
}
function signature(payload: string) {
  return createHmac("sha256", secret()).update(`location:${payload}`).digest("base64url");
}
export function signResolution(data: Resolution) {
  const body = Buffer.from(JSON.stringify({ data, expires: Date.now() + 15 * 60_000 })).toString("base64url");
  return `${body}.${signature(body)}`;
}
export function readResolution(token: string | null, input: string): Resolution | null {
  if (!token) return null;
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = Buffer.from(signature(body));
    const actual = Buffer.from(sig);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString());
    if (parsed.expires < Date.now() || parsed.data.input !== input) return null;
    return parsed.data as Resolution;
  } catch {
    return null;
  }
}
export function prepareIntakeV2(data: IntakeV2) {
  const a = readResolution(data.origin.resolution_token, data.origin.input),
    b = readResolution(data.destination.resolution_token, data.destination.input);
  const address = (side: "origin" | "destination", r: Resolution | null) => ({
    input: data[side].input,
    street: null,
    unit: data[`${side}_unit`],
    city: null,
    state: r ? "FL" : null,
    country: r ? "US" : null,
    postal_code: /^\d{5}$/.test(data[side].input) ? data[side].input : null,
    place_id: r?.place_id ?? null,
    precision: r?.precision ?? "MANUAL",
    county: r?.county ?? null,
  });
  const { origin_unit: _a, destination_unit: _b, ...rest } = data;
  return {
    ...rest,
    origin: address("origin", a),
    destination: address("destination", b),
    first_name: null,
    last_name: null,
    bedrooms:
      data.move_size === "STUDIO"
        ? 0
        : /^BEDROOMS_[1-4]$/.test(data.move_size)
          ? Number(data.move_size.at(-1))
          : null,
    property_type: ["OFFICE", "COMMERCIAL"].includes(data.move_size) ? data.move_size : data.property_type,
    suggested_mode: classifyLocations({ county: a?.county ?? null }, { county: b?.county ?? null }),
    territorial_source: a && b ? "GOOGLE" : "MANUAL",
  };
}

export async function locationRequest(request: Request) {
  await intakeGuard(request, "location");
  let body: unknown;
  try {
    body = JSON.parse((await limitedBody(request, 3000)).toString());
  } catch {
    throw new IntakeError("INVALID_INPUT");
  }
  const parsed = query.safeParse(body);
  if (!parsed.success) throw new IntakeError("INVALID_INPUT");
  const { action, input, session, language, id } = parsed.data;
  if (!process.env.GOOGLE_MAPS_SERVER_API_KEY)
    return Response.json({ error: "DISABLED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const provider = googleProvider(process.env.GOOGLE_MAPS_SERVER_API_KEY);
    if (action === "suggest")
      return Response.json(
        { suggestions: await provider.suggest(input, session, language) },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (!id) throw new IntakeError("INVALID_INPUT");
    const resolved = await provider.resolve(input, id, session, language);
    return Response.json(
      { token: signResolution(resolved), precision: resolved.precision },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof LocationError)
      throw new IntakeError(error.message, error.message === "OUTSIDE_FL" ? 422 : 503);
    throw error;
  }
}
