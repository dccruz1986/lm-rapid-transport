import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createServerClient } from "@supabase/ssr";

const local = await Bun.file(".local/supabase.json").json();
if (!["127.0.0.1", "localhost"].includes(new URL(local.API_URL).hostname)) throw new Error("Local only");
const origins = { web: "http://localhost:3100", admin: "http://localhost:3101" };
let assertions = 0;
function check(value: unknown, label: string) {
  assert(value, label);
  assertions++;
  console.log(`PASS ${label}`);
}
for (const path of ["/", "/services", "/about", "/contact", "/request-quote"]) {
  check((await fetch(`${origins.web}${path}`)).ok, `Production public route ${path}`);
}
const anonymous = await fetch(`${origins.admin}/dashboard`, { redirect: "manual" });
const anonymousHtml = await anonymous.text();
check(
  (anonymous.status === 307 && anonymous.headers.get("location")?.includes("/login")) ||
    (anonymous.status === 200 && anonymousHtml.includes('content="1;url=/login"')),
  "Production admin redirects anonymous visitors (HTTP or streamed Next redirect)",
);
check(
  !/LM-\d{6}/.test(anonymousHtml) && !anonymousHtml.includes("ui-fixture@example.test"),
  "Anonymous response contains no request or staff data",
);
const cookies = new Map<string, string>();
const db = createServerClient(local.API_URL, local.PUBLISHABLE_KEY ?? local.ANON_KEY, {
  cookies: {
    getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
    setAll: (values) => {
      for (const { name, value } of values) cookies.set(name, value);
    },
  },
});
const auth = await db.auth.signInWithPassword({
  email: "ui-fixture@example.test",
  password: "Fixture-only-9pK3!mR7#",
});
check(!auth.error, "Production smoke fixture authenticates via Supabase");
const cookie = [...cookies].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; ");
for (const path of ["/dashboard", "/requests", "/customers", "/moves", "/settings", "/users"]) {
  const response = await fetch(`${origins.admin}${path}`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  check(
    response.status === 200 && (await response.text()).includes("ui-fixture@example.test"),
    `Production authenticated route ${path}`,
  );
}
const secrets = [local.SERVICE_ROLE_KEY, local.SECRET_KEY, local.S3_PROTOCOL_ACCESS_KEY_SECRET].filter(
  (v) => typeof v === "string" && v.length > 20,
);
let files = 0;
async function scan(path: string) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) await scan(file);
    else {
      const content = await readFile(file, "utf8");
      if (secrets.some((secret) => content.includes(secret)))
        throw new Error("Server secret found in public assets");
      files++;
    }
  }
}
for (const app of ["web", "admin"]) await scan(`apps/${app}/.next/static`);
check(files > 0, `Scanned ${files} public build assets; no local elevated keys`);
console.log(`${assertions} production smoke assertions passed.`);
