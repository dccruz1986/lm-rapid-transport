import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { sendInvitation } from "../supabase/functions/resend/handler";

const config = await Bun.file(".local/supabase.json").json();
const base = String(config.API_URL);
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const service = String(config.SERVICE_ROLE_KEY ?? config.SECRET_KEY);
const anon = String(config.ANON_KEY ?? config.PUBLISHABLE_KEY);
async function api(path: string, token: string, body?: unknown, method = "POST") {
  const res = await fetch(base + path, {
    method,
    headers: {
      apikey: token === service ? service : anon,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, data: text ? JSON.parse(text) : null };
}
const ids: string[] = [];
const suffix = crypto.randomUUID();
const password = `${crypto.randomUUID()}!aA9`;
try {
  const adminEmail = `admin-${suffix}@example.test`;
  const admin = await api("/auth/v1/admin/users", service, {
    email: adminEmail,
    password,
    email_confirm: true,
  });
  assert(admin.ok, "Create synthetic admin");
  ids.push(admin.data.id);
  assert(
    (await api(`/rest/v1/profiles?id=eq.${admin.data.id}`, service, { active: true, role: "ADMIN" }, "PATCH"))
      .ok,
  );
  const session = await api("/auth/v1/token?grant_type=password", anon, { email: adminEmail, password });
  assert(session.ok);
  const token = session.data.access_token;
  const email = `invite-${suffix}@example.test`;
  const operation = await api("/rest/v1/rpc/begin_staff_email", token, {
    p_email: email,
    p_role: "DISPATCHER",
  });
  assert(operation.ok && operation.data.operation_id, "Claim invitation");
  const link = await api("/auth/v1/admin/generate_link", service, { type: "invite", email });
  assert(link.ok && link.data.hashed_token, "Generate invite without sending");
  ids.push(link.data.id);
  const profile = await api(`/rest/v1/profiles?id=eq.${link.data.id}`, service, undefined, "GET");
  assert(profile.data[0]?.role === "DISPATCHER", "Reserved role");
  const pending = await api("/rest/v1/rpc/pending_staff_invitation", token, {
    p_email: email,
    p_role: "DISPATCHER",
  });
  assert(pending.data === link.data.id, "Generated invite remains retryable");
  const url = new URL("http://localhost:3001/auth/confirm");
  url.searchParams.set("token_hash", link.data.hashed_token);
  url.searchParams.set("type", "invite");
  const payload = { to: email, operation_id: operation.data.operation_id, action_url: url.toString() };
  const request = () =>
    new Request("http://local/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  const fake = Object.assign(async () => Response.json({ id: "simulated-provider-id" }), {
    preconnect: fetch.preconnect,
  });
  const rejected = Object.assign(async () => Response.json({}, { status: 500 }), {
    preconnect: fetch.preconnect,
  });
  const mailConfig = { apiKey: "test-only", from: "team@example.test", adminUrl: "http://localhost:3001" };
  assert(!(await sendInvitation(request(), mailConfig, rejected)).ok);
  assert((await sendInvitation(request(), mailConfig, fake)).ok);
  assert(!(await api("/auth/v1/verify", anon, { token_hash: "invalid-token", type: "invite" })).ok);
  assert(/^[a-f0-9-]{36}$/.test(link.data.id));
  const setSentAt = (age: string) =>
    execFileSync(
      "docker",
      [
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
        `update auth.users set confirmation_sent_at=now()-interval '${age}' where id='${link.data.id}'`,
      ],
      { stdio: "pipe" },
    );
  setSentAt("2 days");
  assert(
    !(await api("/auth/v1/verify", anon, { token_hash: link.data.hashed_token, type: "invite" })).ok,
    "Expired link rejected",
  );
  setSentAt("0 seconds");
  const activation = await api("/auth/v1/verify", anon, {
    token_hash: link.data.hashed_token,
    type: "invite",
  });
  assert(activation.ok, "Activation works");
  assert(
    (await api("/auth/v1/user", activation.data.access_token, { password }, "PUT")).ok,
    "Password established",
  );
  assert(
    !(await api("/auth/v1/verify", anon, { token_hash: link.data.hashed_token, type: "invite" })).ok,
    "Used link rejected",
  );
  assert((await api("/auth/v1/token?grant_type=password", anon, { email, password })).ok);
  assert(
    !(await api("/rest/v1/rpc/pending_staff_invitation", token, { p_email: email, p_role: "DISPATCHER" })).ok,
  );
  console.log(
    "PASS local Auth role, pending retry, simulated failed/successful email, activation, password, invalid/used links",
  );
} finally {
  for (const id of ids.reverse()) {
    assert((await api(`/rest/v1/profiles?id=eq.${id}`, service, undefined, "DELETE")).ok);
    assert((await api(`/auth/v1/admin/users/${id}`, service, undefined, "DELETE")).ok);
  }
}
