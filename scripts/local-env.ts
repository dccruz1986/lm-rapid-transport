import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";

const status = Bun.spawnSync(["bun", "node_modules/supabase/dist/supabase.js", "status", "-o", "json"], {
  stdout: "pipe",
  stderr: "pipe",
});
if (status.exitCode !== 0) throw new Error("Start local Supabase before configuring the applications.");
const config = JSON.parse(status.stdout.toString());
if (!["localhost", "127.0.0.1"].includes(new URL(config.API_URL).hostname)) {
  throw new Error("This command only configures local Supabase.");
}
await mkdir(".local", { recursive: true });
await Bun.write(".local/supabase.json", JSON.stringify(config));
const template = await Bun.file(".env.example").text();
const values: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: config.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.PUBLISHABLE_KEY ?? config.ANON_KEY,
  SUPABASE_SECRET_KEY: config.SECRET_KEY ?? config.SERVICE_ROLE_KEY,
  INTAKE_HASH_SECRET: randomBytes(32).toString("hex"),
};
for (const app of ["web", "admin"]) {
  const path = `apps/${app}/.env.local`;
  if (await Bun.file(path).exists()) {
    console.log(`${path} already exists; preserved without changes.`);
    continue;
  }
  const content = template.replace(/^([A-Z_]+)=.*$/gm, (line, name: string) =>
    values[name] ? `${name}=${values[name]}` : line,
  );
  await Bun.write(path, content);
  console.log(`Configured ${path} with local development values.`);
}
