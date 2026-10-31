// Explicitly run against local development; never a hosted project.
import assert from "node:assert/strict";

const base = process.env.TEST_WEB_URL ?? "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const config = await Bun.file(".local/supabase.json").json();
assert(["localhost", "127.0.0.1"].includes(new URL(config.API_URL).hostname));
const key = config.SERVICE_ROLE_KEY ?? config.SECRET_KEY;
const data = {
  version: 2,
  full_name: "Fixture New Form API",
  email: null,
  phone: "+13055550179",
  origin: { input: "33147", resolution_token: "forged.token" },
  destination: { input: "33016", resolution_token: null },
  move_size: "BEDROOMS_5_PLUS",
  moving_date: null,
  comments: "Synthetic API test",
  workers: null,
  property_size: null,
  size_unit: null,
  property_type: null,
  origin_floor: null,
  destination_floor: null,
  origin_elevator: null,
  destination_elevator: null,
  origin_unit: null,
  destination_unit: null,
};
let checks = 0;
function check(value: unknown, label: string) {
  assert(value, label);
  checks++;
  console.log(`PASS ${label}`);
}
async function post(path: string, body?: unknown, token?: string) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      ...(token ? { "x-intake-token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json() };
}
const id = crypto.randomUUID();
const results = await Promise.all([
  post("/api/intake", { key: id, website: "", data }),
  post("/api/intake", { key: id, website: "", data }),
]);
check(
  results.every((r) => r.status === 200),
  "concurrent begins accepted",
);
check(results[0]?.data.token === results[1]?.data.token, "same operation yields same token");
const token = results[0]?.data.token;
const finish = await Promise.all([
  post("/api/intake/finalize", undefined, token),
  post("/api/intake/finalize", undefined, token),
]);
check(
  finish.every((r) => r.status === 200) && finish[0]?.data.request_number === finish[1]?.data.request_number,
  "concurrent finalize creates one request",
);
const number = finish[0]?.data.request_number;
const query = await fetch(
  `${config.API_URL}/rest/v1/moving_requests?request_number=eq.${number}&select=*,origin:addresses!moving_requests_origin_id_fkey(*)`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } },
);
check(query.ok, "read own local fixture");
const [row] = await query.json();
check(
  row.full_name === data.full_name && row.first_name === null && row.last_name === null,
  "compound name without fake surname",
);
check(
  row.origin_floor === null && row.origin_elevator === null && row.property_type === null,
  "unknown operational details persist as null",
);
check(row.move_size === "BEDROOMS_5_PLUS" && row.bedrooms === null, "5+ is not exact five");
check(row.origin.street === null && row.origin.input === "33147", "ZIP not stored as street");
check(
  row.suggested_mode === null && !row.territorial_reviewed && row.territorial_source === "MANUAL",
  "forged resolution cannot classify",
);
check(!JSON.stringify(row).includes("forged.token"), "resolution token not persisted in public record");
check(
  (
    await post("/api/intake", {
      key: crypto.randomUUID(),
      website: "",
      data: { ...data, suggested_mode: "LOCAL" },
    })
  ).status === 400,
  "reject client-supplied mode",
);
check(
  (
    await post("/api/intake", {
      key: crypto.randomUUID(),
      website: "",
      data: { ...data, move_size: "INVALID" },
    })
  ).status === 400,
  "reject invalid size",
);
console.log(`${checks} checks passed; local fixture ${number}.`);
