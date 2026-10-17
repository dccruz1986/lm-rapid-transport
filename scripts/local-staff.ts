// Disposable browser-test account. This command refuses hosted Supabase URLs.
const local = await Bun.file(".local/supabase.json").json();
if (!["127.0.0.1", "localhost"].includes(new URL(local.API_URL).hostname)) throw new Error("Local only");
const key = local.SERVICE_ROLE_KEY ?? local.SECRET_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
if (Bun.argv.includes("--cleanup")) {
  const fixture = await Bun.file(".local/ui-fixture.json").json();
  if (!/^[0-9a-f-]{36}$/i.test(fixture.id)) throw new Error("Invalid fixture identity");
  const account = await fetch(`${local.API_URL}/auth/v1/admin/users/${fixture.id}`, { headers });
  if (!account.ok || (await account.json()).email !== "ui-fixture@example.test")
    throw new Error("Fixture identity mismatch");
  const disabled = await fetch(`${local.API_URL}/rest/v1/profiles?id=eq.${fixture.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ active: false }),
  });
  if (!disabled.ok) throw new Error("Could not disable fixture");
  // Only this disposable account's local test activity is removed, never customer records.
  for (const [table, column] of [
    ["notes", "author_id"],
    ["quote_communications", "actor_id"],
    ["pricing_change_history", "actor_id"],
    ["profiles", "id"],
  ]) {
    const deleted = await fetch(`${local.API_URL}/rest/v1/${table}?${column}=eq.${fixture.id}`, {
      method: "DELETE",
      headers,
    });
    if (!deleted.ok) throw new Error(`Could not clean fixture ${table}`);
  }
  const removed = await fetch(`${local.API_URL}/auth/v1/admin/users/${fixture.id}`, {
    method: "DELETE",
    headers,
  });
  if (!removed.ok) throw new Error("Could not delete fixture Auth user");
  const check = await fetch(`${local.API_URL}/auth/v1/admin/users/${fixture.id}`, { headers });
  if (check.status !== 404) throw new Error("Fixture deletion not verified");
  await Bun.file(".local/ui-fixture.json").delete();
  console.log("Disposable local ADMIN and its test activity deleted; Auth deletion verified.");
  process.exit(0);
}
const response = await fetch(`${local.API_URL}/auth/v1/admin/users`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    email: "ui-fixture@example.test",
    password: "Fixture-only-9pK3!mR7#",
    email_confirm: true,
  }),
});
if (!response.ok) throw new Error("Could not create local test account");
const user = await response.json();
const profile = await fetch(`${local.API_URL}/rest/v1/profiles?id=eq.${user.id}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ role: "ADMIN", active: true }),
});
if (!profile.ok) throw new Error("Could not enable local test profile");
await Bun.write(".local/ui-fixture.json", JSON.stringify({ id: user.id }));
console.log("Disposable local browser-test account prepared.");

export {};
