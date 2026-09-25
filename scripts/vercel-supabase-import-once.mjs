import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("Skipping the one-time Supabase import outside the production environment.");
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  ["scripts/supabase-import.mjs", "--apply"],
  { env: process.env, stdio: "inherit" },
);

if (result.error) throw result.error;
if (result.status !== 0) {
  process.exitCode = result.status ?? 1;
}
