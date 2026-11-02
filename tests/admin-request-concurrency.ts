// Local-only synthetic fixture; retained for browser verification, never emails.
import { createRequire } from "node:module";

const { createClient } = createRequire(new URL("../packages/data/package.json", import.meta.url))(
  "@supabase/supabase-js",
);
const config = await Bun.file(".local/supabase.json").json();
if (!["localhost", "127.0.0.1"].includes(new URL(config.API_URL).hostname)) throw new Error("Local only");
const service = createClient(config.API_URL, config.SERVICE_ROLE_KEY ?? config.SECRET_KEY);
const email = `manual-${crypto.randomUUID()}@example.test`;
const password = `Fixture-${crypto.randomUUID()}!`;
const { data: account, error } = await service.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error || !account.user) throw new Error("Could not create local fixture");
const user = account.user;
const { error: profileError } = await service
  .from("profiles")
  .update({ role: "DISPATCHER", active: true })
  .eq("id", user.id);
if (profileError) throw profileError;
const client = createClient(config.API_URL, config.ANON_KEY ?? config.PUBLISHABLE_KEY);
const login = await client.auth.signInWithPassword({ email, password });
if (login.error) throw login.error;
const payload = {
  full_name: "Concurrency manual fixture",
  phone: "+13055550196",
  email: null,
  origin: "33147",
  destination: "33016",
  move_size: "STUDIO",
  moving_date: null,
  comments: "Synthetic local concurrency fixture",
};
const key = crypto.randomUUID();
const retries = await Promise.all(
  Array.from({ length: 6 }, () => client.rpc("create_request", { p_key: key, p_data: payload })),
);
if (retries.some((r) => r.error) || new Set(retries.map((r) => r.data.id)).size !== 1)
  throw new Error("Concurrent retries failed");
const distinct = await Promise.all(
  Array.from({ length: 2 }, () =>
    client.rpc("create_request", {
      p_key: crypto.randomUUID(),
      p_data: { ...payload, phone: "+13055550195" },
    }),
  ),
);
if (distinct.some((r) => r.error) || new Set(distinct.map((r) => r.data.id)).size !== 2)
  throw new Error("Distinct operations failed");
const rows = await service
  .from("moving_requests")
  .select("customer_id")
  .in(
    "id",
    distinct.map((r) => r.data.id),
  );
if (rows.error || new Set(rows.data.map((r: { customer_id: string }) => r.customer_id)).size !== 1)
  throw new Error("Customer uniqueness failed");
await Bun.write(".local/manual-request-ui.json", JSON.stringify({ email, password, userId: user.id }));
console.log(
  "PASS: six simultaneous retries produce one request; two distinct operations share one customer. Local UI fixture saved privately.",
);
