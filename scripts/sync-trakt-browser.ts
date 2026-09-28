import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { access, chmod, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { ConvexHttpClient } from "convex/browser";
import { chromium, type BrowserContext, type Page } from "playwright-core";

import { api } from "../convex/_generated/api";
import { envEntriesToObject, readEnvEntries } from "../packages/config/src/envFile";
import { fetchCurrentlyWatching, syncHistoryPages } from "./sync-trakt";

type EnvRecord = Record<string, string>;

type BrowserAuth = {
  accessToken: string;
  clientId: string;
  expiresAtMs: number | null;
};

const TRAKT_HISTORY_URL = "https://app.trakt.tv/history";
const DEFAULT_SYNC_DAYS = 90;
const DEFAULT_PROFILE_DIR = path.join(homedir(), ".web24", "trakt-browser-profile");
const ENV_PATH = path.join(process.cwd(), ".env.local");

function pickEnv(env: EnvRecord, key: string) {
  return env[key] ?? env[key.toLowerCase()] ?? env[key.toUpperCase()];
}

async function loadEnv() {
  return envEntriesToObject(await readEnvEntries(ENV_PATH));
}

function valueAfter(args: string[], flag: string) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function usage() {
  console.log(`
Usage:
  bun run trakt:browser:login
  bun run trakt:browser:sync [--days 90 | --full] [--headed]

Options:
  --days <number>      Sync this many trailing days (default: ${DEFAULT_SYNC_DAYS})
  --full               Sync the complete Trakt history
  --headed             Show the browser while syncing
  --profile <path>     Override the dedicated browser profile directory
  --convex-url <url>   Override CONVEX_URL from .env.local
`);
}

function readStoredAuth() {
  const candidates: BrowserAuth[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith("oidc.user:")) continue;

    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? "null") as {
        access_token?: string;
        expires_at?: number;
      } | null;
      if (!stored?.access_token) continue;

      const clientId = key.slice(key.lastIndexOf(":") + 1);
      if (!clientId) continue;

      candidates.push({
        accessToken: stored.access_token,
        clientId,
        expiresAtMs: typeof stored.expires_at === "number" ? stored.expires_at * 1000 : null,
      });
    } catch {
      // Ignore unrelated or malformed localStorage entries.
    }
  }

  return candidates
    .filter(candidate => candidate.expiresAtMs === null || candidate.expiresAtMs > Date.now() + 60_000)
    .sort((left, right) => (right.expiresAtMs ?? Number.MAX_SAFE_INTEGER) - (left.expiresAtMs ?? Number.MAX_SAFE_INTEGER))[0] ?? null;
}

async function waitForBrowserAuth(page: Page, timeoutMs = 30_000): Promise<BrowserAuth> {
  try {
    await page.waitForFunction(readStoredAuth, undefined, { timeout: timeoutMs });
  } catch {
    throw new Error(
      "No valid Trakt browser session found. Run `bun run trakt:browser:login` and sign in again.",
    );
  }

  const auth = await page.evaluate(readStoredAuth);
  if (!auth) {
    throw new Error("Trakt reported a session, but no usable access token was available.");
  }
  return auth;
}

async function ensureProfileDirectory(profileDir: string) {
  await mkdir(profileDir, { recursive: true, mode: 0o700 });
  await chmod(profileDir, 0o700);
}

async function resolveBrowserExecutable(env: EnvRecord) {
  const configured = pickEnv(env, "TRAKT_BROWSER_EXECUTABLE");
  if (configured) return configured;

  if (process.platform !== "darwin") return undefined;
  const candidates = [
    "/Applications/Helium.app/Contents/MacOS/Helium",
    path.join(homedir(), "Applications", "Helium.app", "Contents", "MacOS", "Helium"),
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    path.join(homedir(), "Applications", "Chromium.app", "Contents", "MacOS", "Chromium"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    path.join(homedir(), "Applications", "Google Chrome.app", "Contents", "MacOS", "Google Chrome"),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue through the known browser locations.
    }
  }

  return undefined;
}

async function launchBrowser(
  env: EnvRecord,
  profileDir: string,
  headless: boolean,
): Promise<BrowserContext> {
  await ensureProfileDirectory(profileDir);
  const executablePath = await resolveBrowserExecutable(env);
  const channel = pickEnv(env, "TRAKT_BROWSER_CHANNEL") ?? "chrome";

  try {
    return await chromium.launchPersistentContext(profileDir, {
      headless,
      ...(executablePath ? { executablePath } : { channel }),
      viewport: { width: 1280, height: 900 },
    });
  } catch (error) {
    throw new Error(
      "Unable to launch Chromium, Helium, or Chrome. Set TRAKT_BROWSER_EXECUTABLE in .env.local if it is installed in a non-standard location.",
      { cause: error },
    );
  }
}

async function getPage(context: BrowserContext) {
  return context.pages()[0] ?? await context.newPage();
}

async function launchManualLoginBrowser(env: EnvRecord, profileDir: string) {
  const executablePath = await resolveBrowserExecutable(env);
  if (!executablePath) {
    throw new Error(
      "Unable to find Chromium, Helium, or Chrome for the interactive Trakt login.",
    );
  }

  const browser = spawn(
    executablePath,
    [
      `--user-data-dir=${profileDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      TRAKT_HISTORY_URL,
    ],
    { stdio: "ignore" },
  );

  await new Promise<void>((resolve, reject) => {
    browser.once("spawn", resolve);
    browser.once("error", reject);
  });
  return browser;
}

async function stopManualLoginBrowser(browser: ChildProcess) {
  if (browser.exitCode !== null) return;
  browser.kill("SIGTERM");
  await Promise.race([
    once(browser, "exit"),
    new Promise(resolve => setTimeout(resolve, 5_000)),
  ]);
}

async function login(env: EnvRecord, profileDir: string) {
  await ensureProfileDirectory(profileDir);
  const browser = await launchManualLoginBrowser(env, profileDir);
  const prompt = createInterface({ input, output });

  try {
    console.log(`Trakt opened with the dedicated profile at ${profileDir}`);
    await prompt.question("Sign in, confirm your history is visible, then press Enter here... ");
    await stopManualLoginBrowser(browser);

    const context = await launchBrowser(env, profileDir, true);
    const page = await getPage(context);
    try {
      await page.goto(TRAKT_HISTORY_URL, { waitUntil: "domcontentloaded" });
      const auth = await waitForBrowserAuth(page, 10_000);
      const expiry = auth.expiresAtMs ? new Date(auth.expiresAtMs).toISOString() : "managed by Trakt";
      console.log(`Trakt browser session saved (current token expiry: ${expiry}).`);
    } finally {
      await context.close();
    }
  } finally {
    prompt.close();
    await stopManualLoginBrowser(browser);
  }
}

function resolveSyncDays(args: string[]) {
  if (args.includes("--full")) return null;
  const raw = valueAfter(args, "--days") ?? String(DEFAULT_SYNC_DAYS);
  const days = Number(raw);
  if (!Number.isInteger(days) || days < 1 || days > 3650) {
    throw new Error("--days must be a whole number between 1 and 3650.");
  }
  return days;
}

async function sync(env: EnvRecord, args: string[], profileDir: string) {
  const convexUrl = valueAfter(args, "--convex-url") ?? pickEnv(env, "CONVEX_URL");
  if (!convexUrl) throw new Error("Missing CONVEX_URL in .env.local.");

  const days = resolveSyncDays(args);
  const startAtIso = days === null
    ? undefined
    : new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const context = await launchBrowser(env, profileDir, !args.includes("--headed"));

  try {
    const page = await getPage(context);
    await page.goto(TRAKT_HISTORY_URL, { waitUntil: "domcontentloaded" });
    const auth = await waitForBrowserAuth(page);
    const convex = new ConvexHttpClient(convexUrl);
    const tmdbKey = pickEnv(env, "TMDB_KEY");

    console.log(days === null
      ? "Syncing complete Trakt history through the signed-in browser session."
      : `Syncing the last ${days} days of Trakt history through the signed-in browser session.`);

    const history = await syncHistoryPages(
      convex,
      auth.accessToken,
      auth.clientId,
      tmdbKey,
      { endpoint: "users/me/history", startAtIso },
    );
    const currentWatching = await fetchCurrentlyWatching(
      auth.accessToken,
      auth.clientId,
      tmdbKey,
    );

    await convex.mutation(api.trakt.setCurrentWatching, {
      currentWatching,
      syncedAtMs: Date.now(),
    });

    console.log("\nTrakt browser sync complete");
    console.log(`Processed: ${history.totalEntries}`);
    console.log(`Inserted: ${history.totalInserted}`);
    console.log(`Updated: ${history.totalUpdated}`);
    console.log(`Unchanged: ${history.totalSkipped}`);
    console.log(`Deduped: ${history.totalDeduped}`);
  } finally {
    await context.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command || command === "--help" || command === "-h") {
    usage();
    return;
  }

  const env = await loadEnv();
  const profileDir = path.resolve(
    valueAfter(args, "--profile") ??
      pickEnv(env, "TRAKT_BROWSER_PROFILE_DIR") ??
      DEFAULT_PROFILE_DIR,
  );

  if (command === "login") {
    await login(env, profileDir);
    return;
  }
  if (command === "sync") {
    await sync(env, args, profileDir);
    return;
  }

  usage();
  throw new Error(`Unknown command: ${command}`);
}

void main().catch(error => {
  console.error("\nTrakt browser sync failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
