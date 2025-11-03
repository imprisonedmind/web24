"use server";

import "server-only";

import path from "node:path";

import { envEntriesToObject, readEnvEntries, updateEnvFile } from "./envFile";

const ENV_PATH = path.join(process.cwd(), ".env.local");
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

type TokenResponse = {
  access_token: string;
  created_at?: number;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

type EnvRecord = Record<string, string>;

let inFlightRefresh: Promise<string> | null = null;

async function loadEnvRecord(): Promise<EnvRecord> {
  const entries = await readEnvEntries(ENV_PATH);
  const fileEnv = envEntriesToObject(entries);

  const merged: EnvRecord = { ...fileEnv };
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string" && !Object.prototype.hasOwnProperty.call(merged, key)) {
      merged[key] = value;
    }
  }
  return merged;
}

function pickEnv(env: EnvRecord, key: string, fallbackKey?: string): string | undefined {
  const exact = env[key];
  if (exact) return exact;
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

function computeExpiryMs(createdAt?: number, expiresIn?: number): number | undefined {
  if (createdAt === undefined || expiresIn === undefined) return undefined;
  const seconds = createdAt + expiresIn;
  return seconds * 1000;
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

  const updatedEnv = await updateEnvFile(updates, ENV_PATH);
  for (const [key, value] of Object.entries(updatedEnv)) {
    process.env[key] = value;
  }

  return data.access_token;
}

async function refreshToken(
  env: EnvRecord,
  refreshTokenValue: string
): Promise<string> {
  const clientId = pickEnv(env, "TRAKT_CLIENT_ID");
  const clientSecret = pickEnv(env, "TRAKT_CLIENT_SECRET");

  if (!clientId) throw new Error("Missing TRAKT_CLIENT_ID; cannot refresh token.");
  if (!clientSecret) throw new Error("Missing TRAKT_CLIENT_SECRET; cannot refresh token.");

  const payload = {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshTokenValue,
    grant_type: "refresh_token"
  };

  const res = await fetch("https://api.trakt.tv/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to refresh Trakt token (${res.status}): ${body}`);
  }

  const data = (await res.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error("Trakt refresh response missing access_token");
  }

  return persistToken(data);
}

export async function getTraktAccessToken(): Promise<string> {
  const env = await loadEnvRecord();

  const accessToken =
    pickEnv(env, "TRAKT_ACCESS_TOKEN") ?? pickEnv(env, "trakt_access_token");
  if (!accessToken) {
    throw new Error("Trakt access token not configured. Run `bun run trakt:login`.");
  }

  const refresh = pickEnv(env, "TRAKT_REFRESH_TOKEN", "trakt_refresh_token");
  const createdAt = parseInt(pickEnv(env, "TRAKT_TOKEN_CREATED_AT") ?? "", 10);
  const expiresAtSeconds = parseInt(
    pickEnv(env, "TRAKT_TOKEN_EXPIRES_AT") ?? "",
    10
  );
  const expiresInSeconds = parseInt(
    pickEnv(env, "TRAKT_TOKEN_EXPIRES_IN") ?? "",
    10
  );
  const expiresAtMs =
    Number.isFinite(expiresAtSeconds) && expiresAtSeconds
      ? expiresAtSeconds * 1000
      : computeExpiryMs(
          Number.isFinite(createdAt) ? createdAt : undefined,
          Number.isFinite(expiresInSeconds) ? expiresInSeconds : undefined
        );

  const now = Date.now();
  const needsRefresh =
    !!refresh &&
    !!expiresAtMs &&
    expiresAtMs - REFRESH_MARGIN_MS <= now;

  if (!refresh && expiresAtMs && expiresAtMs <= now) {
    throw new Error(
      "Trakt access token expired and no refresh token is available. Run `bun run trakt:login`."
    );
  }

  if (!needsRefresh) {
    return accessToken;
  }

  if (!inFlightRefresh) {
    inFlightRefresh = refreshToken(env, refresh).finally(() => {
      inFlightRefresh = null;
    });
  }

  return inFlightRefresh;
}
