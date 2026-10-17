export {};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Configure the Supabase URL and server secret for the target environment.");
async function call(path: string, body: unknown, method = "POST") {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: { apikey: key as string, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Cleanup operation failed (${response.status}); safe to retry.`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
const candidates: { id: string; paths: string[] }[] = await call(
  "/rest/v1/rpc/intake_cleanup_candidates",
  {},
);
let removed = 0;
for (const candidate of candidates) {
  if (candidate.paths.some((path) => !path.startsWith(`${candidate.id}/`)))
    throw new Error("Invalid cleanup scope");
  if (candidate.paths.length)
    await call("/storage/v1/object/request-photos", { prefixes: candidate.paths }, "DELETE");
  await call("/rest/v1/rpc/intake_cleanup_finish", { p_id: candidate.id });
  removed++;
}
console.log(`Cleaned ${removed} expired intake sessions. Committed request attachments were preserved.`);
