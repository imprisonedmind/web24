import path from "node:path";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import { envEntriesToObject, readEnvEntries } from "../packages/config/src/envFile";

type EnvRecord = Record<string, string>;

const ENV_PATH = path.join(process.cwd(), ".env.local");

function pickEnv(env: EnvRecord, key: string, fallbackKey?: string): string | undefined {
  return (
    env[key] ??
    (fallbackKey ? env[fallbackKey] : undefined) ??
    env[key.toLowerCase()] ??
    env[key.toUpperCase()]
  );
}

function formatError(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

async function loadEnv() {
  const entries = await readEnvEntries(ENV_PATH);
  return envEntriesToObject(entries);
}

async function main() {
  const env = await loadEnv();
  const dryRun = process.argv.includes("--dry-run");
  const convexUrlArgIndex = process.argv.indexOf("--convex-url");
  const convexUrl =
    (convexUrlArgIndex >= 0 ? process.argv[convexUrlArgIndex + 1] : undefined) ??
    pickEnv(env, "VITE_CONVEX_URL") ??
    pickEnv(env, "CONVEX_URL");

  if (!convexUrl) formatError("Missing VITE_CONVEX_URL or CONVEX_URL in .env.local");

  const convex = new ConvexHttpClient(convexUrl);
  const result = await convex.mutation(api.trakt.sanitizeDuplicateHistoryEntries, {
    dryRun,
  });

  console.log("[sanitize-trakt-history] complete");
  console.log(`Convex URL: ${convexUrl}`);
  console.log(`Dry run: ${result.dryRun ? "yes" : "no"}`);
  console.log(`Scanned entries: ${result.scanned}`);
  console.log(`Kept entries: ${result.kept}`);
  console.log(`Duplicate groups: ${result.duplicateGroups}`);
  console.log(`Deleted duplicates: ${result.deleted}`);
  console.log(`Daily activity days rebuilt: ${result.daysRebuilt}`);
}

void main().catch((error) => {
  console.error("\nUnexpected error during Trakt history sanitization\n");
  console.error(error);
  process.exit(1);
});
