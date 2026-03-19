import { spawn } from "node:child_process";
import path from "node:path";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import { envEntriesToObject, readEnvEntries } from "../packages/config/src/envFile";

type EnvRecord = Record<string, string>;

type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval?: number;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  scope?: string;
  created_at?: number;
  expires_in?: number;
};

type TokenErrorResponse = {
  error?: string;
  error_description?: string;
};

type TraktIds = {
  slug?: string | null;
  tmdb?: number | null;
  trakt?: number | null;
};

type TraktImages = {
  poster?: {
    full?: string | null;
    medium?: string | null;
    thumb?: string | null;
  } | null;
  thumb?: {
    full?: string | null;
    medium?: string | null;
    thumb?: string | null;
  } | null;
} | null;

type TraktHistoryItem = {
  id?: number | string;
  type?: "movie" | "show" | "episode";
  watched_at?: string | null;
  movie?: {
    title?: string | null;
    year?: number | null;
    runtime?: number | null;
    ids?: TraktIds | null;
    images?: TraktImages;
  } | null;
  show?: {
    title?: string | null;
    year?: number | null;
    runtime?: number | null;
    ids?: TraktIds | null;
    images?: TraktImages;
  } | null;
  episode?: {
    title?: string | null;
    season?: number | null;
    number?: number | null;
    runtime?: number | null;
    ids?: TraktIds | null;
    images?: TraktImages;
  } | null;
};

type CurrentlyWatching = {
  type: "movie" | "show" | "episode";
  title: string;
  showTitle?: string;
  episodeTitle?: string;
  season?: number;
  episode?: number;
  posterUrl: string;
  url: string;
  progress?: number;
  startedAt?: string;
  expiresAt?: string;
};

const ENV_PATH = path.join(process.cwd(), ".env.local");
const FALLBACK_POSTER = "/fallback-poster.jpg";

function logStep(message: string) {
  console.log(`[sync-trakt] ${message}`);
}

function pickEnv(env: EnvRecord, key: string, fallbackKey?: string): string | undefined {
  return (
    env[key] ??
    (fallbackKey ? env[fallbackKey] : undefined) ??
    env[key.toLowerCase()] ??
    env[key.toUpperCase()]
  );
}

function formatError(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function parseOptionalNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function loadEnv() {
  const entries = await readEnvEntries(ENV_PATH);
  return envEntriesToObject(entries);
}

function maybeOpenBrowser(url: string) {
  if (process.platform !== "darwin") return;
  try {
    const child = spawn("open", [url], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  } catch {
    // ignore
  }
}

async function loginWithDeviceCode(env: EnvRecord) {
  const clientId = pickEnv(env, "TRAKT_CLIENT_ID");
  const clientSecret = pickEnv(env, "TRAKT_CLIENT_SECRET");

  if (!clientId) formatError("Missing TRAKT_CLIENT_ID in .env.local");
  if (!clientSecret) formatError("Missing TRAKT_CLIENT_SECRET in .env.local");

  const deviceRes = await fetch("https://api.trakt.tv/oauth/device/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId }),
  });

  if (!deviceRes.ok) {
    const text = await deviceRes.text();
    formatError(`Failed to start Trakt device login (${deviceRes.status}): ${text}`);
  }

  const deviceData = (await deviceRes.json()) as DeviceCodeResponse;

  console.log("\n🔑 Complete Trakt device login");
  console.log(`1. Open ${deviceData.verification_url}`);
  console.log(`2. Enter code: ${deviceData.user_code}`);
  console.log("3. Authorize the application\n");

  maybeOpenBrowser(deviceData.verification_url);

  const deadline = Date.now() + deviceData.expires_in * 1000;
  let intervalMs = (deviceData.interval ?? 5) * 1000;

  while (Date.now() < deadline) {
    logStep(`Waiting for Trakt authorization... polling again in ${Math.round(intervalMs / 1000)}s`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    const tokenRes = await fetch("https://api.trakt.tv/oauth/device/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: deviceData.device_code,
      }),
    });

    const rawBody = await tokenRes.text();

    if (tokenRes.ok) {
      const data = JSON.parse(rawBody) as TokenResponse;
      if (!data.access_token) formatError("Trakt response missing access_token");
      logStep("Trakt device authorization complete");
      return data;
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
        if (tokenRes.status === 400 && !rawBody.trim().length) {
          continue;
        }
        formatError(`Trakt login failed with unexpected response (${tokenRes.status}): ${rawBody}`);
      }
    }

    const combinedError = [errorPayload?.error, errorPayload?.error_description, headerError]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (tokenRes.status === 400) {
      if (!combinedError.length) {
        logStep("Trakt token endpoint returned 400 with empty body; continuing to poll");
        continue;
      }
      if (combinedError.includes("authorization_pending")) {
        logStep("Trakt authorization still pending");
        continue;
      }
      if (combinedError.includes("slow_down")) {
        intervalMs += 5000;
        logStep(`Trakt asked to slow down; new poll interval ${Math.round(intervalMs / 1000)}s`);
        continue;
      }
      if (combinedError.includes("expired_token")) {
        formatError("Device code expired before authorization completed. Run sync again.");
      }
    }

    formatError(
      `Trakt login failed (${tokenRes.status}): ${rawBody || headerError || "(empty response)"}`,
    );
  }

  formatError("Timed out waiting for Trakt device authorization.");
}

function getStoredTokenData(env: EnvRecord): TokenResponse | null {
  const accessToken = pickEnv(env, "TRAKT_ACCESS_TOKEN");
  const refreshToken = pickEnv(env, "TRAKT_REFRESH_TOKEN");

  if (!accessToken || !refreshToken) return null;

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: pickEnv(env, "TRAKT_TOKEN_TYPE"),
    scope: pickEnv(env, "TRAKT_TOKEN_SCOPE"),
    created_at: parseOptionalNumber(pickEnv(env, "TRAKT_TOKEN_CREATED_AT")),
    expires_in: parseOptionalNumber(pickEnv(env, "TRAKT_TOKEN_EXPIRES_IN")),
  };
}

function traktHeaders(accessToken: string, clientId: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "trakt-api-key": clientId,
    "trakt-api-version": "2",
  };
}

async function fetchTmdbPoster(type: "movie" | "show", tmdbId: number | null | undefined, tmdbKey?: string) {
  if (!tmdbId || !tmdbKey) return FALLBACK_POSTER;

  const endpoint = type === "movie" ? "movie" : "tv";
  const response = await fetch(
    `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${tmdbKey}&language=en-US`,
  );

  if (!response.ok) return FALLBACK_POSTER;

  const data = (await response.json()) as { poster_path?: string | null };
  return typeof data.poster_path === "string" && data.poster_path.length
    ? `https://image.tmdb.org/t/p/w780${data.poster_path}`
    : FALLBACK_POSTER;
}

async function resolvePoster(
  type: "movie" | "show",
  images: TraktImages | undefined,
  tmdbId: number | null | undefined,
  tmdbKey?: string,
) {
  const poster =
    images?.poster?.full ??
    images?.poster?.medium ??
    images?.poster?.thumb ??
    images?.thumb?.full ??
    images?.thumb?.medium ??
    images?.thumb?.thumb;

  if (typeof poster === "string" && poster.length) {
    return poster;
  }

  return fetchTmdbPoster(type, tmdbId, tmdbKey);
}

function clampSlug(prefix: string, slug?: string | null, fallback?: string) {
  if (slug && slug.length) return slug;
  if (fallback) return `${prefix}-${fallback}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

async function normalizeHistoryItem(item: TraktHistoryItem, tmdbKey?: string) {
  const watchedAt = item.watched_at ?? new Date().toISOString();
  const watchedAtMs = new Date(watchedAt).getTime();
  const entryType =
    item.type ?? (item.episode ? "episode" : item.movie ? "movie" : "show");

  if (entryType === "movie" && item.movie) {
    const slug = clampSlug(
      "movie",
      item.movie.ids?.slug,
      String(item.movie.ids?.trakt ?? item.movie.ids?.tmdb ?? item.id ?? watchedAt),
    );
    const posterUrl = await resolvePoster("movie", item.movie.images, item.movie.ids?.tmdb, tmdbKey);
    const runtimeMinutes = Number(item.movie.runtime ?? 0) || 0;
    const title = item.movie.title ?? "Untitled movie";
    const href = `https://trakt.tv/movies/${slug}`;

    return {
      historyId: String(item.id ?? `movie-${slug}-${watchedAt}`),
      watchedAt,
      watchedAtMs,
      entryType,
      title,
      subtitle: item.movie.year ? String(item.movie.year) : undefined,
      posterUrl,
      href,
      runtimeMinutes,
      aggregateKey: `movie-${slug}`,
      aggregateType: "movie" as const,
      aggregateTitle: title,
      aggregateHref: href,
      aggregatePosterUrl: posterUrl,
      aggregateRuntimeMinutes: runtimeMinutes,
    };
  }

  if (item.show) {
    const slug = clampSlug(
      "show",
      item.show.ids?.slug,
      String(item.show.ids?.trakt ?? item.show.ids?.tmdb ?? item.id ?? watchedAt),
    );
    const posterUrl = await resolvePoster("show", item.show.images, item.show.ids?.tmdb, tmdbKey);
    const season = typeof item.episode?.season === "number" ? item.episode.season : undefined;
    const episode = typeof item.episode?.number === "number" ? item.episode.number : undefined;
    const episodeTitle = item.episode?.title ?? undefined;
    const code =
      typeof season === "number" && typeof episode === "number"
        ? `S${String(season).padStart(2, "0")} • E${String(episode).padStart(2, "0")}`
        : undefined;
    const subtitle = [code, episodeTitle].filter(Boolean).join(" • ") || undefined;
    const title = item.show.title ?? episodeTitle ?? "Untitled show";
    const href =
      typeof season === "number" && typeof episode === "number"
        ? `https://trakt.tv/shows/${slug}/seasons/${season}/episodes/${episode}`
        : `https://trakt.tv/shows/${slug}`;
    const aggregateRuntimeMinutes =
      Number(item.show.runtime ?? item.episode?.runtime ?? 0) || 0;
    const runtimeMinutes = Number(item.episode?.runtime ?? item.show.runtime ?? 0) || 0;

    return {
      historyId: String(item.id ?? `show-${slug}-${watchedAt}`),
      watchedAt,
      watchedAtMs,
      entryType,
      title,
      subtitle,
      posterUrl,
      href,
      showTitle: item.show.title ?? undefined,
      episodeTitle,
      season,
      episode,
      runtimeMinutes,
      aggregateKey: `show-${slug}`,
      aggregateType: "show" as const,
      aggregateTitle: item.show.title ?? title,
      aggregateHref: `https://trakt.tv/shows/${slug}`,
      aggregatePosterUrl: posterUrl,
      aggregateRuntimeMinutes,
    };
  }

  return null;
}

async function syncHistoryPages(
  convex: ConvexHttpClient,
  accessToken: string,
  clientId: string,
  tmdbKey?: string,
) {
  let totalEntries = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (let page = 1; page <= 100; page++) {
    logStep(`Fetching Trakt history page ${page}`);
    const response = await fetch(
      `https://api.trakt.tv/sync/history?type=all&page=${page}&limit=100&extended=full,images`,
      { headers: traktHeaders(accessToken, clientId) },
    );

    if (!response.ok) {
      const text = await response.text();
      formatError(`Failed fetching Trakt history page ${page}: ${response.status} ${text}`);
    }

    const batch = (await response.json()) as TraktHistoryItem[];
    logStep(`Fetched ${batch.length} items from page ${page}`);
    if (!batch.length) break;

    const normalizedBatch: NonNullable<Awaited<ReturnType<typeof normalizeHistoryItem>>>[] = [];
    for (const item of batch) {
      const normalized = await normalizeHistoryItem(item, tmdbKey);
      if (normalized) normalizedBatch.push(normalized);
    }

    if (normalizedBatch.length) {
      logStep(`Upserting page ${page} into Convex (${normalizedBatch.length} normalized entries)`);
      const result = await convex.mutation(api.trakt.upsertHistoryBatch, { entries: normalizedBatch });
      totalEntries += normalizedBatch.length;
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalSkipped += result.skipped;
      logStep(
        `Synced ${totalEntries} total history entries so far (${totalInserted} inserted, ${totalUpdated} updated, ${totalSkipped} unchanged)`,
      );
    }

    if (batch.length < 100) break;
  }

  return {
    totalEntries,
    totalInserted,
    totalUpdated,
    totalSkipped,
  };
}

async function fetchCurrentlyWatching(
  accessToken: string,
  clientId: string,
  tmdbKey?: string,
): Promise<CurrentlyWatching | undefined> {
  logStep("Fetching current watching state");
  const response = await fetch("https://api.trakt.tv/users/me/watching?extended=full,images", {
    headers: traktHeaders(accessToken, clientId),
  });

  if (response.status === 204) {
    logStep("No current watching item");
    return undefined;
  }
  if (!response.ok) {
    const text = await response.text();
    formatError(`Failed fetching currently watching: ${response.status} ${text}`);
  }

  const item = (await response.json()) as any;
  if (!item) return undefined;

  const type =
    item.type ?? (item.episode ? "episode" : item.movie ? "movie" : item.show ? "show" : "movie");
  const posterUrl = await resolvePoster(
    type === "movie" ? "movie" : "show",
    item.movie?.images ?? item.show?.images ?? item.episode?.images,
    item.movie?.ids?.tmdb ?? item.show?.ids?.tmdb,
    tmdbKey,
  );

  if (type === "movie" && item.movie) {
    const slug = clampSlug("movie", item.movie.ids?.slug, String(item.movie.ids?.trakt ?? item.movie.ids?.tmdb));
    return {
      type,
      title: item.movie.title ?? "Untitled movie",
      posterUrl,
      url: `https://trakt.tv/movies/${slug}`,
      progress: typeof item.progress === "number" ? item.progress : undefined,
      startedAt: item.started_at ?? undefined,
      expiresAt: item.expires_at ?? undefined,
    };
  }

  const showSlug = clampSlug("show", item.show?.ids?.slug, String(item.show?.ids?.trakt ?? item.show?.ids?.tmdb));
  const season = typeof item.episode?.season === "number" ? item.episode.season : undefined;
  const episode = typeof item.episode?.number === "number" ? item.episode.number : undefined;

  return {
    type,
    title: (type === "episode" ? item.show?.title : item.show?.title) ?? item.episode?.title ?? "Untitled show",
    showTitle: item.show?.title ?? undefined,
    episodeTitle: item.episode?.title ?? undefined,
    season,
    episode,
    posterUrl,
    url:
      typeof season === "number" && typeof episode === "number"
        ? `https://trakt.tv/shows/${showSlug}/seasons/${season}/episodes/${episode}`
        : `https://trakt.tv/shows/${showSlug}`,
    progress: typeof item.progress === "number" ? item.progress : undefined,
    startedAt: item.started_at ?? undefined,
    expiresAt: item.expires_at ?? undefined,
  };
}

async function main() {
  const env = await loadEnv();
  const convexUrlArgIndex = process.argv.indexOf("--convex-url");
  const convexUrl =
    (convexUrlArgIndex >= 0 ? process.argv[convexUrlArgIndex + 1] : undefined) ??
    pickEnv(env, "VITE_CONVEX_URL") ??
    pickEnv(env, "CONVEX_URL");

  if (!convexUrl) formatError("Missing VITE_CONVEX_URL or CONVEX_URL in .env.local");

  const tokenData = getStoredTokenData(env) ?? (await loginWithDeviceCode(env));
  const convex = new ConvexHttpClient(convexUrl);
  const clientId = pickEnv(env, "TRAKT_CLIENT_ID");
  const tmdbKey = pickEnv(env, "TMDB_KEY");

  if (!clientId) formatError("Missing TRAKT_CLIENT_ID in .env.local");

  const createdAtSeconds = tokenData.created_at ?? Math.floor(Date.now() / 1000);
  const expiresInSeconds = tokenData.expires_in ?? 7 * 24 * 60 * 60;
  const expiresAtMs = (createdAtSeconds + expiresInSeconds) * 1000;

  logStep("Storing Trakt auth state in Convex");
  await convex.action(api.trakt.storeBootstrapTokens, {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenType: tokenData.token_type,
    scope: tokenData.scope,
    createdAtSeconds,
    expiresInSeconds,
    expiresAtMs,
  });

  logStep(`Starting full Trakt history backfill into ${convexUrl}`);
  const historyResult = await syncHistoryPages(
    convex,
    tokenData.access_token,
    clientId,
    tmdbKey,
  );

  const currentWatching = await fetchCurrentlyWatching(
    tokenData.access_token,
    clientId,
    tmdbKey,
  );

  await convex.mutation(api.trakt.setCurrentWatching, {
    currentWatching,
    syncedAtMs: Date.now(),
  });

  logStep("Running trailing 72-hour Convex sync");
  const syncResult = await convex.action(api.trakt.runRecentSync, { windowHours: 72 });

  console.log("\n✅ Trakt sync complete");
  console.log(`Backfilled history entries: ${historyResult.totalEntries}`);
  console.log(`Backfill inserted: ${historyResult.totalInserted}`);
  console.log(`Backfill updated: ${historyResult.totalUpdated}`);
  console.log(`Backfill unchanged: ${historyResult.totalSkipped}`);
  console.log(`History entries processed: ${syncResult.processed}`);
  console.log(`Inserted: ${syncResult.inserted}`);
  console.log(`Updated: ${syncResult.updated}`);
  console.log(`Unchanged: ${syncResult.skipped}`);
  console.log(`Currently watching: ${syncResult.currentWatching ?? "none"}`);
}

void main().catch((error) => {
  console.error("\n❌ Unexpected error during Trakt sync\n");
  console.error(error);
  process.exit(1);
});
