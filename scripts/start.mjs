import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const app = process.argv[2];
if (!["web", "admin"].includes(app)) throw new Error("Choose web or admin");
const root = fileURLToPath(new URL(`../apps/${app}/`, import.meta.url));
const require = createRequire(new URL(`../apps/${app}/package.json`, import.meta.url));
const port = process.env.PORT ?? "3000";
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error("Invalid PORT");
const child = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "start", "-H", "0.0.0.0", "-p", port],
  { cwd: root, stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } },
);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
