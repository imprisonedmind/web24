import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type EnvEntry =
  | { type: "pair"; key: string; value: string }
  | { type: "raw"; value: string };

const DEFAULT_ENV_PATH = path.join(process.cwd(), ".env.local");

const PAIR_REGEX = /^\s*([\w.-]+)\s*=\s*(.*)\s*$/;

function stripQuotes(value: string): string {
  if (!value) return value;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    const inner = value.slice(1, -1);
    return inner.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\"/g, '"');
  }
  return value;
}

function formatValue(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/"/g, '\\"');
  return `"${escaped}"`;
}

export async function readEnvEntries(
  envPath: string = DEFAULT_ENV_PATH
): Promise<EnvEntry[]> {
  try {
    const file = await readFile(envPath, "utf8");
    const lines = file.replace(/\r\n/g, "\n").split("\n");

    return lines.map<EnvEntry>(line => {
      const match = line.match(PAIR_REGEX);
      if (!match) return { type: "raw", value: line };
      return {
        type: "pair",
        key: match[1],
        value: stripQuotes(match[2] ?? "")
      };
    });
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

export function envEntriesToObject(entries: EnvEntry[]): Record<string, string> {
  return entries.reduce<Record<string, string>>((acc, entry) => {
    if (entry.type === "pair") acc[entry.key] = entry.value;
    return acc;
  }, {});
}

export function applyEnvUpdates(
  entries: EnvEntry[],
  updates: Record<string, string | undefined>
): EnvEntry[] {
  const remaining = new Map(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );

  const next = entries.map(entry => {
    if (entry.type !== "pair") return entry;
    if (!remaining.has(entry.key)) return entry;
    const value = remaining.get(entry.key)!;
    remaining.delete(entry.key);
    return { ...entry, value };
  });

  for (const [key, value] of remaining) {
    next.push({ type: "pair", key, value: value! });
  }

  return next;
}

export async function writeEnvEntries(
  entries: EnvEntry[],
  envPath: string = DEFAULT_ENV_PATH
): Promise<void> {
  const content = entries
    .map(entry => {
      if (entry.type === "raw") return entry.value;
      return `${entry.key}=${formatValue(entry.value)}`;
    })
    .join("\n")
    .concat("\n");

  await writeFile(envPath, content, "utf8");
}

const DUPLICATE_KEYS = new Set([
  "trakt_access_token",
  "trakt_refresh_token",
  "spotify_access_token",
  "spotify_refresh_token"
]);

export async function updateEnvFile(
  updates: Record<string, string | undefined>,
  envPath: string = DEFAULT_ENV_PATH
): Promise<Record<string, string>> {
  const entries = await readEnvEntries(envPath);
  const merged = applyEnvUpdates(entries, updates);
  const sanitized = merged.filter(entry => {
    if (entry.type !== "pair") return true;
    if (DUPLICATE_KEYS.has(entry.key)) return false;
    return true;
  });
  await writeEnvEntries(sanitized, envPath);
  return envEntriesToObject(sanitized);
}
