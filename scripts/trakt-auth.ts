import path from "node:path";

import { envEntriesToObject, readEnvEntries, updateEnvFile } from "../src/lib/envFile";

type TokenResponse = {
  access_token: string;
  created_at?: number;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

const ENV_PATH = path.join(process.cwd(), ".env.local");

type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval?: number;
};

type TokenErrorResponse = {
  error: string;
  error_description?: string;
};

function pickEnv(env: Record<string, string>, key: string, fallbackKey?: string): string | undefined {
  const direct = env[key];
  if (direct) return direct;
  if (fallbackKey) {
    const fallback = env[fallbackKey];
    if (fallback) return fallback;
  }
  const lower = env[key.toLowerCase()];
  if (lower) return lower;
  const upper = env[key.toUpperCase()];
  if (upper) return upper;
  return undefined;
}

function formatError(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

async function login() {
  const entries = await readEnvEntries(ENV_PATH);
  const env = envEntriesToObject(entries);

  const clientId = pickEnv(env, "TRAKT_CLIENT_ID");
  const clientSecret = pickEnv(env, "TRAKT_CLIENT_SECRET");

  if (!clientId) formatError("Missing TRAKT_CLIENT_ID in .env.local");
  if (!clientSecret) formatError("Missing TRAKT_CLIENT_SECRET in .env.local");

  const deviceRes = await fetch("https://api.trakt.tv/oauth/device/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId })
  });

  if (!deviceRes.ok) {
    const text = await deviceRes.text();
    formatError(`Failed to start device login (${deviceRes.status}): ${text}`);
  }

  const deviceData = (await deviceRes.json()) as DeviceCodeResponse;

  console.log("\n🔑 Complete Trakt device login");
  console.log(`1. Open ${deviceData.verification_url}`);
  console.log(`2. Enter code: ${deviceData.user_code}`);
  console.log("3. Authorize the application\n");

  const deadline = Date.now() + deviceData.expires_in * 1000;
  let intervalMs = (deviceData.interval ?? 5) * 1000;

  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));

    const tokenRes = await fetch("https://api.trakt.tv/oauth/device/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: deviceData.device_code
      })
    });

    const rawBody = await tokenRes.text();

    if (tokenRes.ok) {
      let data: TokenResponse;
      try {
        data = rawBody ? (JSON.parse(rawBody) as TokenResponse) : ({} as TokenResponse);
      } catch (parseError) {
        formatError(
          `Trakt login succeeded but response was invalid JSON: ${rawBody ?? "(empty response)"}`
        );
        return;
      }

      if (!data.access_token) formatError("Trakt response missing access_token");

      const createdAt = data.created_at ?? Math.floor(Date.now() / 1000);
      const expiresAt =
        data.expires_in !== undefined ? createdAt + data.expires_in : undefined;

  const updates: Record<string, string | undefined> = {
    TRAKT_ACCESS_TOKEN: data.access_token,
    TRAKT_REFRESH_TOKEN: data.refresh_token,
    TRAKT_TOKEN_CREATED_AT: String(createdAt),
    TRAKT_TOKEN_EXPIRES_IN:
      data.expires_in !== undefined ? String(data.expires_in) : undefined,
    TRAKT_TOKEN_EXPIRES_AT: expiresAt ? String(expiresAt) : undefined,
    TRAKT_TOKEN_SCOPE: data.scope,
    TRAKT_TOKEN_TYPE: data.token_type
  };

      const updatedEnv = await updateEnvFile(updates, ENV_PATH);

      for (const [key, value] of Object.entries(updatedEnv)) {
        process.env[key] = value;
      }

      console.log("\n✅ Trakt access token stored in .env.local\n");
      return;
    }

    const headerError =
      tokenRes.headers.get("x-trakt-api-error") ??
      tokenRes.headers.get("x-trakt-error") ??
      tokenRes.headers.get("x-trakt-authentication-error") ??
      tokenRes.headers.get("x-error") ??
      tokenRes.headers.get("www-authenticate") ??
      undefined;

    let errorPayload: TokenErrorResponse | null = null;
    if (rawBody) {
      try {
        errorPayload = JSON.parse(rawBody) as TokenErrorResponse;
      } catch {
        formatError(
          `Trakt login failed with unexpected response (${tokenRes.status}): ${rawBody}`
        );
      }
    }

    if (!errorPayload?.error) {
      if (tokenRes.status === 400) {
        if (headerError?.toLowerCase().includes("authorization_pending")) {
          continue;
        }
        if (headerError?.toLowerCase().includes("slow_down")) {
          intervalMs += 5000;
          continue;
        }
        if (headerError?.toLowerCase().includes("expired_token")) {
          formatError("Device code expired before authorization was completed. Run the command again.");
        }
        if (headerError) {
          formatError(
            `Trakt login failed (${tokenRes.status}): ${headerError}`
          );
        }
        if (headerError) {
          console.log(`…still waiting for authorization from Trakt (${headerError})`);
        } else {
          console.log("…still waiting for authorization from Trakt (retrying)");
        }
        continue;
      }
      formatError(`Trakt login failed (${tokenRes.status}): ${rawBody || headerError || "(empty response)"}`);
    }

    const error = errorPayload!;
    if (error.error === "authorization_pending") {
      continue;
    }

    if (error.error === "slow_down") {
      intervalMs += 5000;
      continue;
    }

    if (error.error === "expired_token") {
      formatError("Device code expired before authorization was completed. Run the command again.");
    }

    formatError(
      `Trakt login failed: ${error.error}${
        error.error_description ? ` - ${error.error_description}` : ""
      }`
    );
  }

  formatError("Timed out waiting for device authorization. Please run the command again.");
}

async function main() {
  const command = process.argv[2] ?? "login";
  switch (command) {
    case "login":
      await login();
      break;
    default:
      formatError(`Unknown command "${command}". Try "bun run scripts/trakt-auth.ts login".`);
  }
}

main().catch(error => {
  console.error("\n❌ Unexpected error during Trakt auth\n");
  console.error(error);
  process.exit(1);
});
