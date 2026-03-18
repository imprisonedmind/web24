import { envEntriesToObject, readEnvEntries, updateEnvFile } from "@web24/config/env-file";

const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const REFRESH_RETRY_DELAY_MS = 15 * 60 * 1000;

type TokenResponse = {
  access_token: string;
  created_at?: number;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

type EnvRecord = Record<string, string>;

let inFlightRefresh: Promise<string | null> | null = null;
let lastRefreshFailure:
  | {
      token: string;
      timestamp: number;
    }
  | null = null;

const TOKEN_ENV_KEYS = [
  "TRAKT_ACCESS_TOKEN",
  "TRAKT_REFRESH_TOKEN",
  "TRAKT_TOKEN_CREATED_AT",
  "TRAKT_TOKEN_EXPIRES_IN",
  "TRAKT_TOKEN_EXPIRES_AT",
  "TRAKT_TOKEN_SCOPE",
  "TRAKT_TOKEN_TYPE"
] as const;

class TraktRefreshError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly responseBody?: string
  ) {
    super(message);
    this.name = "TraktRefreshError";
  }
}

async function loadEnvRecord(): Promise<EnvRecord> {
  const entries = await readEnvEntries();
  const fileEnv = envEntriesToObject(entries);

  const merged: EnvRecord = { ...fileEnv };
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string" && !Object.prototype.hasOwnProperty.call(merged, key)) {
      merged[key] = value;
    }
  }

  return merged;
}

function pickEnv(env: EnvRecord, key: string, fallbackKey?: string) {
  return (
    env[key] ??
    (fallbackKey ? env[fallbackKey] : undefined) ??
    env[key.toLowerCase()] ??
    env[key.toUpperCase()]
  );
}

function computeExpiryMs(createdAt?: number, expiresIn?: number) {
  if (createdAt === undefined || expiresIn === undefined) return undefined;
  return (createdAt + expiresIn) * 1000;
}

async function persistToken(data: TokenResponse): Promise<string> {
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

  const updatedEnv = await updateEnvFile(updates);
  Object.assign(process.env, updatedEnv);

  return data.access_token;
}

async function clearStoredTokens() {
  const updates: Record<string, string | undefined> = {};
  for (const key of TOKEN_ENV_KEYS) {
    updates[key] = undefined;
    delete process.env[key];
  }

  await updateEnvFile(updates);
}

async function refreshToken(env: EnvRecord, refreshTokenValue: string) {
  const clientId = pickEnv(env, "TRAKT_CLIENT_ID");
  const clientSecret = pickEnv(env, "TRAKT_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Missing Trakt client credentials; cannot refresh token.");
  }

  const response = await fetch("https://api.trakt.tv/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshTokenValue,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new TraktRefreshError(
      `Failed to refresh Trakt token (${response.status}): ${body}`,
      response.status,
      body
    );
  }

  const data = (await response.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error("Trakt refresh response missing access_token");
  }

  return persistToken(data);
}

export async function getTraktAccessToken(cookieToken?: string | null) {
  if (cookieToken) return cookieToken;

  try {
    const env = await loadEnvRecord();
    const accessToken =
      pickEnv(env, "TRAKT_ACCESS_TOKEN") ?? pickEnv(env, "trakt_access_token");

    if (!accessToken) return null;

    const refresh = pickEnv(env, "TRAKT_REFRESH_TOKEN", "trakt_refresh_token");
    const createdAt = parseInt(pickEnv(env, "TRAKT_TOKEN_CREATED_AT") ?? "", 10);
    const expiresAtSeconds = parseInt(pickEnv(env, "TRAKT_TOKEN_EXPIRES_AT") ?? "", 10);
    const expiresInSeconds = parseInt(pickEnv(env, "TRAKT_TOKEN_EXPIRES_IN") ?? "", 10);

    const expiresAtMs =
      Number.isFinite(expiresAtSeconds) && expiresAtSeconds
        ? expiresAtSeconds * 1000
        : computeExpiryMs(
            Number.isFinite(createdAt) ? createdAt : undefined,
            Number.isFinite(expiresInSeconds) ? expiresInSeconds : undefined
          );

    const now = Date.now();
    const tokenExpired = !!expiresAtMs && expiresAtMs <= now;
    const needsRefresh =
      !!refresh && !!expiresAtMs && expiresAtMs - REFRESH_MARGIN_MS <= now;

    if (!refresh && tokenExpired) {
      await clearStoredTokens();
      return null;
    }

    if (!needsRefresh || !refresh) {
      return accessToken;
    }

    if (
      lastRefreshFailure &&
      lastRefreshFailure.token === refresh &&
      now - lastRefreshFailure.timestamp < REFRESH_RETRY_DELAY_MS
    ) {
      return tokenExpired ? null : accessToken;
    }

    if (!inFlightRefresh) {
      inFlightRefresh = (async () => {
        try {
          const token = await refreshToken(env, refresh);
          lastRefreshFailure = null;
          return token;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : typeof error === "string" ? error : undefined;
          const responseBody =
            error instanceof TraktRefreshError ? error.responseBody ?? message : message;
          const isInvalidGrant =
            typeof responseBody === "string" &&
            responseBody.toLowerCase().includes("invalid_grant");

          lastRefreshFailure = { token: refresh, timestamp: Date.now() };

          if (tokenExpired || isInvalidGrant) {
            await clearStoredTokens();
            return null;
          }

          return accessToken;
        }
      })().finally(() => {
        inFlightRefresh = null;
      });
    }

    return inFlightRefresh;
  } catch (error) {
    console.warn("[api/trakt] unable to load access token", error);
    return null;
  }
}
