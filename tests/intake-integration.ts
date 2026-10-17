import assert from "node:assert/strict";
import { miamiDate } from "@lm/validation";
import { pngFixture } from "./image-fixture";

const base = process.env.TEST_WEB_URL ?? "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local tests only");
let checks = 0;
function check(value: unknown, label: string): asserts value {
  assert(value, label);
  checks++;
  console.log(`PASS ${label}`);
}
const address = {
  street: "Integration fixture street",
  unit: "",
  city: "Miami",
  state: "FL",
  country: "US",
  postal_code: "33130",
};
const data = {
  first_name: "Integration",
  last_name: "Example",
  phone: "+13055550101",
  email: null,
  origin: address,
  destination: { ...address, street: "Integration destination" },
  moving_date: null as string | null,
  property_type: "OFFICE",
  bedrooms: null,
  property_size: null,
  size_unit: null,
  origin_floor: 0,
  destination_floor: 0,
  origin_elevator: false,
  destination_elevator: false,
  workers: null,
  comments: "Synthetic intake integration fixture",
};
async function post(path: string, body?: unknown, token?: string, origin = base, file?: Uint8Array) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": file ? "image/png" : "application/json",
      ...(token ? { "x-intake-token": token } : {}),
    },
    body: file ? Buffer.from(file) : body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json() };
}
const key = crypto.randomUUID();
check(
  (await post("/api/intake", { key, data, website: "" }, undefined, "https://invalid.example")).status ===
    403,
  "Reject unexpected origin",
);
check(
  (await post("/api/intake", { key, data: { ...data, phone: "+14165550101" }, website: "" })).status === 400,
  "Reject Canadian phone server-side",
);
check(
  (await post("/api/intake", { key, data: { ...data, moving_date: miamiDate() }, website: "" })).status ===
    400,
  "Reject today's Miami date",
);
let sunday = new Date(`${miamiDate()}T12:00:00Z`);
do {
  sunday = new Date(sunday.getTime() + 86_400_000);
} while (sunday.getUTCDay() !== 0);
check(
  (
    await post("/api/intake", {
      key,
      data: { ...data, moving_date: sunday.toISOString().slice(0, 10) },
      website: "",
    })
  ).status === 400,
  "Reject Sunday server-side",
);
check(
  (await post("/api/intake", { key, data: { ...data, discount: 1 }, website: "" })).status === 400,
  "Reject extra fields",
);
const start = await post("/api/intake", { key, data, website: "" });
check(start.status === 200 && start.data.token, "Start commercial intake without date, email or crew");
const token = start.data.token;
const repeated = await post("/api/intake", { key, data, website: "" });
check(repeated.data.token === token, "Session start retry is idempotent");
check(
  (await post("/api/intake", { key, data: { ...data, first_name: "Different" }, website: "" })).status ===
    409,
  "Same key cannot replace submitted data",
);
const badPhoto = await post(
  `/api/intake/files?id=${crypto.randomUUID()}&name=invalid.png`,
  undefined,
  token,
  base,
  new TextEncoder().encode("not a PNG"),
);
check(badPhoto.status === 400 && badPhoto.data.error === "INVALID_FILE", "Reject spoofed image content");
check(
  (
    await post(
      `/api/intake/files?id=${crypto.randomUUID()}&name=large.png`,
      undefined,
      token,
      base,
      new Uint8Array(5 * 1024 * 1024 + 1),
    )
  ).status === 413,
  "Enforce upload body limit",
);
const [first, retry] = await Promise.all([
  post("/api/intake/finalize", undefined, token),
  post("/api/intake/finalize", undefined, token),
]);
check(first.status === 200 && /^LM-\d+$/.test(first.data.request_number), "Finalize without photos");
check(
  first.data.request_number === retry.data.request_number,
  "Concurrent finalization returns one request number",
);
check(
  (await post("/api/intake/finalize", undefined, "0".repeat(64))).status !== 200,
  "Unknown intake token cannot retrieve a request",
);
const local = await Bun.file(".local/supabase.json").json();
assert(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const secret = local.SERVICE_ROLE_KEY ?? local.SECRET_KEY;
const headers = { apikey: secret, Authorization: `Bearer ${secret}` };
const customer = await (
  await fetch(`${local.API_URL}/rest/v1/customers?phone=eq.%2B13055550101`, { headers })
).json();
check(
  customer.length === 1 && customer[0].first_name === "Cliente 1",
  "Anonymous intake reuses customer without overwriting their name",
);
const requests = await (
  await fetch(`${local.API_URL}/rest/v1/moving_requests?request_number=eq.${first.data.request_number}`, {
    headers,
  })
).json();
check(
  requests.length === 1 && requests[0].first_name === data.first_name && requests[0].email === null,
  "Request retains submitted contact snapshot",
);
const photoStart = await post("/api/intake", { key: crypto.randomUUID(), data, website: "" });
check(photoStart.status === 200, "Start intake with photos");
const photoToken = photoStart.data.token;
const photoIds = Array.from({ length: 8 }, () => crypto.randomUUID());
for (const id of photoIds) {
  const uploaded = await post(
    `/api/intake/files?id=${id}&name=fixture.png`,
    undefined,
    photoToken,
    base,
    pngFixture,
  );
  check(uploaded.status === 200, "Decode and upload valid private image");
}
const photoRetry = await post(
  `/api/intake/files?id=${photoIds[0]}&name=fixture.png`,
  undefined,
  photoToken,
  base,
  pngFixture,
);
check(photoRetry.status === 200, "Retry uploaded image without duplication");
check(
  (
    await post(
      `/api/intake/files?id=${crypto.randomUUID()}&name=ninth.png`,
      undefined,
      photoToken,
      base,
      pngFixture,
    )
  ).data.error === "FILE_LIMIT",
  "Reject ninth photo server-side",
);
const omitted = await fetch(`${base}/api/intake/files?id=${photoIds[7]}`, {
  method: "DELETE",
  headers: { Origin: base, "x-intake-token": photoToken },
});
check(omitted.ok, "Explicitly omit an uploaded photo");
const photoFinal = await post("/api/intake/finalize", undefined, photoToken);
check(photoFinal.status === 200, "Finalize request with remaining photos");
const photoRequest = await (
  await fetch(
    `${local.API_URL}/rest/v1/moving_requests?request_number=eq.${photoFinal.data.request_number}`,
    { headers },
  )
).json();
const attachments = await (
  await fetch(`${local.API_URL}/rest/v1/attachments?request_id=eq.${photoRequest[0].id}`, { headers })
).json();
check(attachments.length === 7, "Persist only the seven retained attachments");
check(
  !(await fetch(`${local.API_URL}/storage/v1/object/public/request-photos/${attachments[0].object_path}`)).ok,
  "Submitted photos remain private",
);
const abandonedKey = crypto.randomUUID();
const abandoned = await post("/api/intake", { key: abandonedKey, data, website: "" });
const abandonedPhoto = crypto.randomUUID();
check(
  (
    await post(
      `/api/intake/files?id=${abandonedPhoto}&name=abandoned.png`,
      undefined,
      abandoned.data.token,
      base,
      pngFixture,
    )
  ).status === 200,
  "Create abandoned upload fixture",
);
const expire = Bun.spawnSync(
  [
    "docker",
    "exec",
    "supabase_db_lm-rapid-transport",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `update private.intake_sessions set expires_at=now()-interval '2 hours' where idempotency_key='${abandonedKey}'::uuid;`,
  ],
  { stdout: "pipe", stderr: "pipe" },
);
check(expire.exitCode === 0, "Expire only this synthetic session");
const cleanup = Bun.spawnSync(["bun", "--env-file=apps/web/.env.local", "scripts/cleanup-intake.ts"], {
  stdout: "pipe",
  stderr: "pipe",
});
check(cleanup.exitCode === 0, "Clean abandoned files and metadata");
check(
  (
    await fetch(
      `${local.API_URL}/storage/v1/object/authenticated/request-photos/${attachments[0].object_path}`,
      { headers },
    )
  ).ok,
  "Cleanup preserves committed photos",
);
check(
  (await post("/api/intake/finalize", undefined, abandoned.data.token)).status !== 200,
  "Cleaned session cannot finalize",
);
const concurrentData = { ...data, phone: "+13055550199" };
const sessions = await Promise.all(
  [1, 2].map(() => post("/api/intake", { key: crypto.randomUUID(), data: concurrentData, website: "" })),
);
const results = await Promise.all(sessions.map((s) => post("/api/intake/finalize", undefined, s.data.token)));
check(
  results.every((r) => r.status === 200) &&
    results[0]?.data.request_number !== results[1]?.data.request_number,
  "Distinct concurrent submissions create distinct requests",
);
const sharedCustomer = await (
  await fetch(`${local.API_URL}/rest/v1/customers?phone=eq.%2B13055550199`, { headers })
).json();
check(sharedCustomer.length === 1, "Concurrent submissions share one normalized customer");
console.log(
  `${checks} intake integration assertions passed. Synthetic requests remain in the local test database.`,
);
