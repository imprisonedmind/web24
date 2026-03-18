import path from "node:path";
import { fileURLToPath } from "node:url";

import { envEntriesToObject, readEnvEntries } from "@web24/config/env-file";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const rootEnvPath = path.join(rootDir, ".env.local");

export async function hydrateProcessEnvFromRoot() {
  const entries = await readEnvEntries(rootEnvPath);
  const rootEnv = envEntriesToObject(entries);

  for (const [key, value] of Object.entries(rootEnv)) {
    if (typeof process.env[key] !== "string" || process.env[key]?.length === 0) {
      process.env[key] = value;
    }
  }
}
