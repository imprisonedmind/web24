import http from "node:http";
import { randomBytes } from "node:crypto";
import path from "node:path";

import {
  envEntriesToObject,
  readEnvEntries,
  updateEnvFile
} from "../src/lib/envFile";

const ENV_PATH = path.join(process.cwd(), ".env.local");
const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

const REQUIRED_SCOPES = [
  "user-read-playback-state",
  "user-read-recently-played"
];

const DEFAULT_PORT = 8721;
const DEFAULT_CALLBACK_PATH = "/spotify/callback";

function formatError(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function ensureEnvVariable(
  env: Record<string, string>,
  key: string
): string {
  const value = env[key] ?? env[key.toLowerCase()] ?? env[key.toUpperCase()];
  if (!value) {
    formatError(`Missing ${key} in .env.local`);
  }
  return value;
}

function buildAuthorizeUrl(params: Record<string, string>) {
  const url = new URL(AUTH_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

async function acquireAuthCode(
  redirectUri: string,
  expectedState: string
): Promise<string> {
  const url = new URL(redirectUri);
  const port = Number(url.port || DEFAULT_PORT);
  const pathname = url.pathname || DEFAULT_CALLBACK_PATH;

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) return;
      const incoming = new URL(req.url, `http://localhost:${port}`);

      if (incoming.pathname !== pathname) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const error = incoming.searchParams.get("error");
      if (error) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Spotify authorization failed. You can close this window.");
        server.close();
        reject(new Error(`Spotify authorization error: ${error}`));
        return;
      }

      const code = incoming.searchParams.get("code");
      const state = incoming.searchParams.get("state");
      if (!code) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing ?code in callback. You can close this window.");
        server.close();
        reject(new Error("Spotify callback missing code parameter"));
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("State mismatch. You can close this window.");
        server.close();
        reject(new Error("State mismatch in Spotify callback"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<p>Spotify authorization successful. You can return to the terminal.</p>"
      );
      server.close();
      resolve(code);
    });

    server.listen(port, () => {
      console.log(`\n🔐 Listening for Spotify callback on http://localhost:${port}${pathname}`);
    });

    server.on("error", err => {
      reject(err);
    });
  });
}

async function requestTokens(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri
  }).toString();

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    formatError(`Failed to exchange Spotify code (${response.status}): ${text}`);
  }

  return response.json() as Promise<{
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
  }>;
}

async function login() {
  const entries = await readEnvEntries(ENV_PATH);
  const env = envEntriesToObject(entries);

  const clientId = ensureEnvVariable(env, "SPOTIFY_CLIENT_ID");
  const clientSecret = ensureEnvVariable(env, "SPOTIFY_CLIENT_SECRET");
  const redirectUri =
    env.SPOTIFY_REDIRECT_URI ??
    env.spotify_redirect_uri ??
    `http://localhost:${DEFAULT_PORT}${DEFAULT_CALLBACK_PATH}`;

  const state = randomBytes(16).toString("hex");
  const scopes = REQUIRED_SCOPES.join(" ");

  const authorizeUrl = buildAuthorizeUrl({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    show_dialog: "true"
  });

  console.log("\n🎧 Spotify Authorization");
  console.log("1. Open the URL below in your browser.");
  console.log("2. Approve the requested scopes.");
  console.log("3. After Spotify redirects, return here.\n");
  console.log(authorizeUrl);

  let code: string;
  try {
    code = await acquireAuthCode(redirectUri, state);
  } catch (error: any) {
    formatError(error?.message ?? "Failed to capture Spotify authorization code.");
  }

  const tokenResponse = await requestTokens(
    clientId,
    clientSecret,
    code,
    redirectUri
  );

  if (!tokenResponse.refresh_token) {
    formatError(
      "Spotify did not return a refresh_token. Ensure you checked the consent screen and try again."
    );
  }

  const createdAt = Math.floor(Date.now() / 1000);
  const expiresAt = createdAt + (tokenResponse.expires_in ?? 0);

  const updates: Record<string, string | undefined> = {
    SPOTIFY_REFRESH_TOKEN: tokenResponse.refresh_token,
    spotify_refresh_token: tokenResponse.refresh_token,
    SPOTIFY_ACCESS_TOKEN: tokenResponse.access_token,
    spotify_access_token: tokenResponse.access_token,
    SPOTIFY_TOKEN_SCOPE: tokenResponse.scope,
    SPOTIFY_TOKEN_TYPE: tokenResponse.token_type,
    SPOTIFY_TOKEN_CREATED_AT: String(createdAt),
    SPOTIFY_TOKEN_EXPIRES_AT: String(expiresAt)
  };

  await updateEnvFile(updates, ENV_PATH);

  console.log("\n✅ Spotify refresh token stored in .env.local");
}

async function main() {
  const command = process.argv[2] ?? "login";
  switch (command) {
    case "login":
      await login();
      break;
    default:
      formatError(
        `Unknown command "${command}". Try "bun run scripts/spotify-auth.ts login".`
      );
  }
}

main().catch(error => {
  console.error("\n❌ Unexpected error during Spotify auth\n");
  console.error(error);
  process.exit(1);
});

