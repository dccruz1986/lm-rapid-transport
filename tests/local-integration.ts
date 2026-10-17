// Explicitly run against the disposable local stack; never against a hosted project.
import assert from "node:assert/strict";

const config = await Bun.file(".local/supabase.json").json();
const base = String(config.API_URL);
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Local Supabase required");
const anon = String(config.ANON_KEY ?? config.PUBLISHABLE_KEY);
const service = String(config.SERVICE_ROLE_KEY ?? config.SECRET_KEY);
assert(anon && service && service !== "undefined", "Local keys required");
const users: string[] = [];
let objectPath = "";
let attachmentId = "";
let assertions = 0;
function check(condition: unknown, label: string): asserts condition {
  assert(condition, label);
  assertions++;
  console.log(`PASS ${label}`);
}
async function api(path: string, token: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      apikey: token === service ? service : anon,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, data: text ? JSON.parse(text) : null };
}
async function mailToken(email: string, type: string) {
  const inbox = String(config.INBUCKET_URL ?? "http://127.0.0.1:54324");
  assert(["localhost", "127.0.0.1"].includes(new URL(inbox).hostname));
  for (let attempt = 0; attempt < 20; attempt++) {
    const result = await fetch(`${inbox}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const list = await result.json();
    for (const entry of list.messages ?? []) {
      const message = await (await fetch(`${inbox}/api/v1/message/${entry.ID}`)).json();
      const html = String(message.HTML).replaceAll("&amp;", "&");
      const link = html
        .match(/https?:[^"\s<>]+token_hash=[^"\s<>]+/g)
        ?.find((url) => url.includes(`type=${type}`));
      if (link) return new URL(link).searchParams.get("token_hash");
    }
    await Bun.sleep(250);
  }
  throw new Error(`Local ${type} mail did not arrive with the expected template`);
}
const suffix = crypto.randomUUID();
const adminEmail = `test-admin-${suffix}@example.test`;
const invitedEmail = `test-dispatch-${suffix}@example.test`;
const password = `${crypto.randomUUID()}!aA1`;
try {
  check(
    !(await api("/auth/v1/signup", anon, "POST", { email: `public-${suffix}@example.test`, password })).ok,
    "Public signup disabled",
  );
  const created = await api("/auth/v1/admin/users", service, "POST", {
    email: adminEmail,
    password,
    email_confirm: true,
  });
  check(created.ok && created.data.id, "Create local Auth fixture");
  users.push(created.data.id);
  check(
    (
      await api(`/rest/v1/profiles?id=eq.${created.data.id}`, service, "PATCH", {
        role: "ADMIN",
        active: true,
      })
    ).ok,
    "Enable local ADMIN fixture",
  );
  const logged = await api("/auth/v1/token?grant_type=password", anon, "POST", {
    email: adminEmail,
    password,
  });
  check(
    logged.ok,
    `Password login (${logged.status}: ${logged.data?.error_code ?? logged.data?.code ?? "ok"})`,
  );
  const admin = logged.data.access_token;
  check(!(await api("/rest/v1/customers", anon)).ok, "Anonymous REST read denied");
  check((await api("/rest/v1/customers", admin)).data.length >= 10, "Active staff reads seeded customers");
  check(
    (
      await api("/rest/v1/rpc/reserve_staff_invite", admin, "POST", {
        p_email: invitedEmail,
        p_role: "DISPATCHER",
      })
    ).ok,
    "Reserve authorized invitation",
  );
  const invited = await api("/auth/v1/invite", service, "POST", { email: invitedEmail });
  check(invited.ok && invited.data.id, "Invitation sent to local Mailpit");
  users.push(invited.data.id);
  const token_hash = await mailToken(invitedEmail, "invite");
  const verified = await api("/auth/v1/verify", anon, "POST", { token_hash, type: "invite" });
  check(verified.ok && verified.data.access_token, "Invitation token accepted");
  const dispatcher = verified.data.access_token;
  check(
    !(await api("/auth/v1/verify", anon, "POST", { token_hash, type: "invite" })).ok,
    "Consumed invitation rejected",
  );
  check((await api("/auth/v1/user", dispatcher, "PUT", { password })).ok, "Invited user chooses password");
  const permissions = await api("/rest/v1/rpc/my_permissions", dispatcher, "POST", {});
  check(
    permissions.data.includes("quotes.approve") && !permissions.data.includes("pricing.manage"),
    "Dispatcher operational permissions and global limit",
  );
  check(
    !(await api("/rest/v1/pricing_settings?id=eq.true", dispatcher, "PATCH", { hourly_two: 1 })).ok,
    "Direct global-price mutation denied",
  );
  check(
    !(
      await api("/rest/v1/rpc/reserve_staff_invite", dispatcher, "POST", {
        p_email: `bad-${suffix}@example.test`,
        p_role: "ADMIN",
      })
    ).ok,
    "Direct privilege escalation denied",
  );
  objectPath = `integration/${suffix}.png`;
  const photo = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jA1sAAAAASUVORK5CYII=",
    "base64",
  );
  async function upload(token: string) {
    return fetch(`${base}/storage/v1/object/request-photos/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: token === service ? service : anon,
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/png",
      },
      body: photo,
    });
  }
  check(!(await upload(anon)).ok, "Anonymous Storage upload denied");
  check((await upload(service)).ok, "Privileged private upload");
  const request = await api("/rest/v1/moving_requests?select=id&limit=1", admin);
  const attachment = await api("/rest/v1/attachments", service, "POST", {
    request_id: request.data[0].id,
    object_path: objectPath,
    file_name: "fixture.png",
    mime_type: "image/png",
    byte_size: photo.length,
  });
  check(attachment.ok, "Register private attachment");
  attachmentId = attachment.data[0].id;
  const photoUrl = `${base}/storage/v1/object/authenticated/request-photos/${objectPath}`;
  check(
    (await fetch(photoUrl, { headers: { apikey: anon, Authorization: `Bearer ${dispatcher}` } })).ok,
    "Authorized staff reads attached photo",
  );
  check(
    !(await fetch(`${base}/storage/v1/object/public/request-photos/${objectPath}`)).ok,
    "Private bucket has no public download",
  );
  check(
    (await api(`/rest/v1/profiles?id=eq.${invited.data.id}`, service, "PATCH", { active: false })).ok,
    "Deactivate profile",
  );
  check(
    (await api("/rest/v1/customers", dispatcher)).data.length === 0,
    "Existing token loses record access immediately",
  );
  check(
    !(await fetch(photoUrl, { headers: { apikey: anon, Authorization: `Bearer ${dispatcher}` } })).ok,
    "Existing token loses Storage access",
  );
  check((await api("/auth/v1/recover", anon, "POST", { email: adminEmail })).ok, "Recovery captured locally");
  const recoveryHash = await mailToken(adminEmail, "recovery");
  check(
    (await api("/auth/v1/verify", anon, "POST", { token_hash: recoveryHash, type: "recovery" })).ok,
    "Recovery token accepted",
  );
  console.log(`${assertions} local integration assertions passed.`);
} finally {
  if (objectPath)
    await api("/storage/v1/object/request-photos", service, "DELETE", { prefixes: [objectPath] });
  if (attachmentId) await api(`/rest/v1/attachments?id=eq.${attachmentId}`, service, "DELETE");
  for (const id of users.reverse()) {
    await api(`/rest/v1/profiles?id=eq.${id}`, service, "DELETE");
    await api(`/auth/v1/admin/users/${id}`, service, "DELETE");
  }
}
