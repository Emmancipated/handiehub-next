#!/usr/bin/env node
// Applies committed Prisma migrations during the build.
//
// On Vercel we skip preview deployments so that a feature-branch preview can
// never mutate the shared production database. Production deployments, `vercel
// dev` (development) and local builds still apply migrations.
//
// Overrides:
//   FORCE_MIGRATIONS=1  run even on previews (e.g. previews use their own DB)
//   SKIP_MIGRATIONS=1   never run migrations
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Resolve the Prisma CLI explicitly so the script works whether it is run via
// `npm run build` (node_modules/.bin on PATH) or directly with `node`.
const prismaCli = require.resolve("prisma/build/index.js");

// "production" | "preview" | "development" on Vercel, undefined locally.
const vercelEnv = process.env.VERCEL_ENV;

if (process.env.SKIP_MIGRATIONS === "1") {
  console.log("[migrate] SKIP_MIGRATIONS=1 set; skipping migrations.");
  process.exit(0);
}

if (vercelEnv === "preview" && process.env.FORCE_MIGRATIONS !== "1") {
  console.log("[migrate] Vercel preview deployment detected; skipping migrations.");
  console.log(
    "[migrate] Set FORCE_MIGRATIONS=1 if previews use a database of their own.",
  );
  process.exit(0);
}

console.log(`[migrate] Applying migrations (VERCEL_ENV=${vercelEnv ?? "local"}).`);

try {
  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    stdio: "inherit",
  });
} catch (error) {
  console.error("[migrate] Migration failed; aborting build.");
  process.exit(typeof error.status === "number" ? error.status : 1);
}
