import { v } from "convex/values";

import {
  type ActionCtx,
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { api, internal } from "./_generated/api";

const FALLBACK_POSTER = "/fallback-poster.jpg";
const RECENT_SYNC_WINDOW_MS = 72 * 60 * 60 * 1000;
const TOKEN_REFRESH_LEEWAY_MS = 5 * 60 * 1000;
const STATE_KEY = "default";

const historyEntryValidator = v.object({
  historyId: v.string(),
  watchedAt: v.string(),
  watchedAtMs: v.number(),
  entryType: v.union(v.literal("movie"), v.literal("show"), v.literal("episode")),
  title: v.string(),
  subtitle: v.optional(v.string()),
  posterUrl: v.string(),
  href: v.string(),
  showTitle: v.optional(v.string()),
  episodeTitle: v.optional(v.string()),
  season: v.optional(v.number()),
  episode: v.optional(v.number()),
  runtimeMinutes: v.number(),
  aggregateKey: v.string(),
  aggregateType: v.union(v.literal("movie"), v.literal("show")),
  aggregateTitle: v.string(),
  aggregateHref: v.string(),
  aggregatePosterUrl: v.string(),
  aggregateRuntimeMinutes: v.number(),
});

const currentWatchingValidator = v.object({
  type: v.union(v.literal("movie"), v.literal("show"), v.literal("episode")),
  title: v.string(),
  showTitle: v.optional(v.string()),
  episodeTitle: v.optional(v.string()),
  season: v.optional(v.number()),
  episode: v.optional(v.number()),
  posterUrl: v.string(),
  url: v.string(),
  progress: v.optional(v.number()),
  startedAt: v.optional(v.string()),
  expiresAt: v.optional(v.string()),
});

const authStateValidator = v.object({
  accessToken: v.string(),
  refreshToken: v.string(),
  tokenType: v.optional(v.string()),
  scope: v.optional(v.string()),
  createdAtSeconds: v.optional(v.number()),
  expiresInSeconds: v.optional(v.number()),
  expiresAtMs: v.number(),
});

const dailyActivityValidator = v.object({
  date: v.string(),
  totalSeconds: v.number(),
  movieSeconds: v.number(),
  episodeSeconds: v.number(),
  updatedAtMs: v.number(),
});

type HistoryEntry = {
  historyId: string;
  watchedAt: string;
  watchedAtMs: number;
  entryType: "movie" | "show" | "episode";
  title: string;
  subtitle?: string;
  posterUrl: string;
  href: string;
  showTitle?: string;
  episodeTitle?: string;
  season?: number;
  episode?: number;
  runtimeMinutes: number;
  aggregateKey: string;
  aggregateType: "movie" | "show";
  aggregateTitle: string;
  aggregateHref: string;
  aggregatePosterUrl: string;
  aggregateRuntimeMinutes: number;
};

type CurrentWatching = {
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

type TraktAuthState = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  scope?: string;
  createdAtSeconds?: number;
  expiresInSeconds?: number;
  expiresAtMs: number;
};

type RecentSyncResult = {
  windowHours: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  deduped: number;
  currentWatching: string | null;
};

type DailyActivity = {
  date: string;
  totalSeconds: number;
  movieSeconds: number;
  episodeSeconds: number;
  updatedAtMs: number;
};

type DailyActivityDelta = {
  date: string;
  totalSeconds: number;
  movieSeconds: number;
  episodeSeconds: number;
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

type TraktWatchingItem = {
  type?: "movie" | "show" | "episode";
  progress?: number;
  started_at?: string | null;
  expires_at?: string | null;
  movie?: {
    title?: string | null;
    ids?: TraktIds | null;
    images?: TraktImages;
  } | null;
  show?: {
    title?: string | null;
    ids?: TraktIds | null;
    images?: TraktImages;
  } | null;
  episode?: {
    title?: string | null;
    season?: number | null;
    number?: number | null;
    images?: TraktImages;
  } | null;
};

type TraktTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  scope?: string;
  created_at?: number;
  expires_in?: number;
};

function entriesEqual(left: Record<string, unknown>, right: Record<string, unknown>) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getActivityDate(watchedAtMs: number) {
  return new Date(watchedAtMs).toISOString().slice(0, 10);
}

function getHistoryDedupeKey(entry: HistoryEntry) {
  const date = getActivityDate(entry.watchedAtMs);

  if (entry.entryType === "movie") {
    return `${date}:movie:${entry.aggregateKey}`;
  }

  if (typeof entry.season === "number" && typeof entry.episode === "number") {
    return `${date}:episode:${entry.aggregateKey}:s${entry.season}:e${entry.episode}`;
  }

  return `${date}:${entry.entryType}:${entry.href || entry.aggregateKey}`;
}

function isPreferredHistoryEntry(candidate: HistoryEntry, current: HistoryEntry) {
  if (candidate.watchedAtMs !== current.watchedAtMs) {
    return candidate.watchedAtMs > current.watchedAtMs;
  }

  return candidate.historyId.localeCompare(current.historyId) > 0;
}

function toDailyActivityDelta(entry: HistoryEntry): DailyActivityDelta {
  const seconds = Math.max(0, (entry.runtimeMinutes || 0) * 60);
  const isMovie = entry.entryType === "movie";

  return {
    date: getActivityDate(entry.watchedAtMs),
    totalSeconds: seconds,
    movieSeconds: isMovie ? seconds : 0,
    episodeSeconds: isMovie ? 0 : seconds,
  };
}

function addDailyActivityDelta(
  totals: Map<string, DailyActivityDelta>,
  delta: DailyActivityDelta,
  multiplier = 1,
) {
  if (!delta.totalSeconds && !delta.movieSeconds && !delta.episodeSeconds) return;

  const current = totals.get(delta.date) ?? {
    date: delta.date,
    totalSeconds: 0,
    movieSeconds: 0,
    episodeSeconds: 0,
  };

  current.totalSeconds += delta.totalSeconds * multiplier;
  current.movieSeconds += delta.movieSeconds * multiplier;
  current.episodeSeconds += delta.episodeSeconds * multiplier;
  totals.set(delta.date, current);
}

function subtractDailyActivityDelta(delta: DailyActivityDelta): DailyActivityDelta {
  return {
    date: delta.date,
    totalSeconds: -delta.totalSeconds,
    movieSeconds: -delta.movieSeconds,
    episodeSeconds: -delta.episodeSeconds,
  };
}

async function applyDailyActivityDelta(ctx: any, delta: DailyActivityDelta) {
  if (!delta.totalSeconds && !delta.movieSeconds && !delta.episodeSeconds) return;

  const existing = await ctx.db
    .query("traktDailyActivity")
    .withIndex("by_date", (q: any) => q.eq("date", delta.date))
    .unique();

  const nextTotalSeconds = Math.max(0, (existing?.totalSeconds ?? 0) + delta.totalSeconds);
  const nextMovieSeconds = Math.max(0, (existing?.movieSeconds ?? 0) + delta.movieSeconds);
  const nextEpisodeSeconds = Math.max(0, (existing?.episodeSeconds ?? 0) + delta.episodeSeconds);

  if (!nextTotalSeconds && !nextMovieSeconds && !nextEpisodeSeconds) {
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return;
  }

  const patch: DailyActivity = {
    date: delta.date,
    totalSeconds: nextTotalSeconds,
    movieSeconds: nextMovieSeconds,
    episodeSeconds: nextEpisodeSeconds,
    updatedAtMs: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    return;
  }

  await ctx.db.insert("traktDailyActivity", patch);
}

async function deleteHistoryEntry(ctx: any, entry: HistoryEntry & { _id: any }) {
  await ctx.db.delete(entry._id);
  await applyDailyActivityDelta(ctx, subtractDailyActivityDelta(toDailyActivityDelta(entry)));
}

async function replaceDailyActivity(ctx: any, rows: DailyActivity[]) {
  const existing = await ctx.db.query("traktDailyActivity").collect();
  await Promise.all(existing.map((doc: any) => ctx.db.delete(doc._id)));

  for (const row of rows) {
    if (!row.totalSeconds && !row.movieSeconds && !row.episodeSeconds) continue;
    await ctx.db.insert("traktDailyActivity", row);
  }
}

async function rebuildDailyActivityFromEntries(ctx: any, entries: HistoryEntry[]) {
  const totals = new Map<string, DailyActivityDelta>();
  for (const entry of entries) {
    addDailyActivityDelta(totals, toDailyActivityDelta(entry));
  }

  const updatedAtMs = Date.now();
  const rows = Array.from(totals.values())
    .filter((row) => row.totalSeconds > 0)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((row) => ({
      ...row,
      updatedAtMs,
    }));

  await replaceDailyActivity(ctx, rows);
  return rows.length;
}

async function sanitizeDuplicateHistoryEntriesImpl(ctx: any, dryRun = false) {
  const entries = (await ctx.db.query("traktHistoryEntries").collect()) as (HistoryEntry & {
    _id: any;
    _creationTime: number;
  })[];
  const groups = new Map<string, (HistoryEntry & { _id: any; _creationTime: number })[]>();

  for (const entry of entries) {
    const key = getHistoryDedupeKey(entry);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  let duplicateGroups = 0;
  let deleted = 0;
  const keptEntries: HistoryEntry[] = [];

  for (const group of groups.values()) {
    const preferred = group.reduce((winner, candidate) =>
      isPreferredHistoryEntry(candidate, winner) ? candidate : winner,
    );
    keptEntries.push(preferred);

    if (group.length <= 1) continue;

    duplicateGroups += 1;
    const duplicates = group.filter((entry) => entry._id !== preferred._id);
    deleted += duplicates.length;

    if (!dryRun) {
      for (const duplicate of duplicates) {
        await ctx.db.delete(duplicate._id);
      }
    }
  }

  const daysRebuilt = dryRun ? 0 : await rebuildDailyActivityFromEntries(ctx, keptEntries);

  return {
    scanned: entries.length,
    kept: keptEntries.length,
    duplicateGroups,
    deleted,
    daysRebuilt,
    dryRun,
  };
}

async function upsertHistoryEntries(ctx: any, entries: HistoryEntry[]) {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let deduped = 0;

  for (const entry of entries) {
    const existing = await ctx.db
      .query("traktHistoryEntries")
      .withIndex("by_historyId", (q: any) => q.eq("historyId", entry.historyId))
      .collect();

    if (!existing.length) {
      const dedupeKey = getHistoryDedupeKey(entry);
      const duplicateEntries = (await ctx.db.query("traktHistoryEntries").collect()).filter(
        (row: HistoryEntry) => getHistoryDedupeKey(row) === dedupeKey,
      );

      if (duplicateEntries.length) {
        const preferred = duplicateEntries.reduce(
          (current: HistoryEntry & { _id: any }, candidate: HistoryEntry & { _id: any }) =>
            isPreferredHistoryEntry(candidate, current) ? candidate : current,
        );

        if (!isPreferredHistoryEntry(entry, preferred)) {
          skipped += 1;
          deduped += 1;
          continue;
        }

        for (const duplicate of duplicateEntries) {
          await deleteHistoryEntry(ctx, duplicate);
          deduped += 1;
        }
      }

      await ctx.db.insert("traktHistoryEntries", entry);
      await applyDailyActivityDelta(ctx, toDailyActivityDelta(entry));
      inserted += 1;
      continue;
    }

    const [current, ...duplicates] = existing;
    for (const duplicate of duplicates) {
      await deleteHistoryEntry(ctx, duplicate);
      deduped += 1;
    }

    const { _id: _currentId, _creationTime: _currentCreationTime, ...currentData } = current;

    const dedupeKey = getHistoryDedupeKey(entry);
    const duplicateEntries = (await ctx.db.query("traktHistoryEntries").collect()).filter(
      (row: HistoryEntry & { _id: any }) =>
        row._id !== current._id && getHistoryDedupeKey(row) === dedupeKey,
    );

    if (duplicateEntries.length) {
      const preferred = duplicateEntries.reduce(
        (winner: HistoryEntry & { _id: any }, candidate: HistoryEntry & { _id: any }) =>
          isPreferredHistoryEntry(candidate, winner) ? candidate : winner,
        current,
      );

      if (preferred._id !== current._id && !isPreferredHistoryEntry(entry, preferred)) {
        await deleteHistoryEntry(ctx, current);
        skipped += 1;
        deduped += 1;
        continue;
      }

      for (const duplicate of duplicateEntries) {
        await deleteHistoryEntry(ctx, duplicate);
        deduped += 1;
      }
    }

    if (entriesEqual(currentData, entry)) {
      skipped += 1;
      continue;
    }

    const currentDelta = toDailyActivityDelta(currentData as HistoryEntry);
    const nextDelta = toDailyActivityDelta(entry);
    await ctx.db.patch(current._id, entry);
    await applyDailyActivityDelta(ctx, subtractDailyActivityDelta(currentDelta));
    await applyDailyActivityDelta(ctx, nextDelta);
    updated += 1;
  }

  return { inserted, updated, skipped, deduped };
}

async function setCurrentWatchingState(ctx: any, currentWatching: CurrentWatching | undefined, syncedAtMs: number) {
  const existing = await ctx.db
    .query("traktState")
    .withIndex("by_key", (q: any) => q.eq("key", STATE_KEY))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      currentWatching,
      syncedAtMs,
    });
    return { updated: true };
  }

  await ctx.db.insert("traktState", {
    key: STATE_KEY,
    currentWatching,
    syncedAtMs,
  });

  return { updated: true };
}

function getRequiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} in Convex environment`);
  }
  return value;
}

function traktHeaders(accessToken: string, clientId: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "trakt-api-key": clientId,
    "trakt-api-version": "2",
  };
}

function clampSlug(prefix: string, slug?: string | null, fallback?: string) {
  if (slug && slug.length) return slug;
  if (fallback) return `${prefix}-${fallback}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
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

async function normalizeHistoryItem(item: TraktHistoryItem, tmdbKey?: string): Promise<HistoryEntry | null> {
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
      aggregateType: "movie",
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
    const aggregateRuntimeMinutes = Number(item.show.runtime ?? item.episode?.runtime ?? 0) || 0;
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
      aggregateType: "show",
      aggregateTitle: item.show.title ?? title,
      aggregateHref: `https://trakt.tv/shows/${slug}`,
      aggregatePosterUrl: posterUrl,
      aggregateRuntimeMinutes,
    };
  }

  return null;
}

async function normalizeCurrentWatching(item: TraktWatchingItem, tmdbKey?: string): Promise<CurrentWatching | undefined> {
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
    title: item.show?.title ?? item.episode?.title ?? "Untitled show",
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

async function fetchTraktJson<T>(url: string, accessToken: string, clientId: string) {
  const response = await fetch(url, { headers: traktHeaders(accessToken, clientId) });
  if (response.status === 204) {
    return { status: 204, data: null as T | null };
  }
  const body = await response.text();
  if (!response.ok) {
    const error = new Error(`Trakt request failed (${response.status}): ${body || "(empty response)"}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return {
    status: response.status,
    data: body ? (JSON.parse(body) as T) : null,
  };
}

async function refreshAccessToken(refreshToken: string) {
  const clientId = getRequiredEnv("TRAKT_CLIENT_ID");
  const clientSecret = getRequiredEnv("TRAKT_CLIENT_SECRET");
  const response = await fetch("https://api.trakt.tv/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to refresh Trakt token (${response.status}): ${body || "(empty response)"}`);
  }

  const data = JSON.parse(body) as TraktTokenResponse;
  if (!data.access_token || !data.refresh_token) {
    throw new Error("Trakt refresh response missing access_token or refresh_token");
  }

  const createdAtSeconds = data.created_at ?? Math.floor(Date.now() / 1000);
  const expiresInSeconds = data.expires_in ?? 7 * 24 * 60 * 60;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    scope: data.scope,
    createdAtSeconds,
    expiresInSeconds,
    expiresAtMs: (createdAtSeconds + expiresInSeconds) * 1000,
  };
}

async function getValidAccessToken(ctx: ActionCtx, forceRefresh = false): Promise<TraktAuthState> {
  const auth = (await ctx.runQuery(internal.trakt.getAuthStateInternal, {})) as TraktAuthState | null;
  if (!auth) {
    throw new Error("Missing Trakt auth state in Convex. Run bun run sync-trakt to bootstrap.");
  }

  const now = Date.now();
  if (!forceRefresh && auth.expiresAtMs > now + TOKEN_REFRESH_LEEWAY_MS) {
    return auth;
  }

  const refreshed = await refreshAccessToken(auth.refreshToken);
  await ctx.runMutation(internal.trakt.setAuthStateInternal, refreshed);
  return refreshed;
}

export const clearHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("traktHistoryEntries").collect();
    const dailyActivity = await ctx.db.query("traktDailyActivity").collect();
    await Promise.all(existing.map((doc) => ctx.db.delete(doc._id)));
    await Promise.all(dailyActivity.map((doc) => ctx.db.delete(doc._id)));
    return { deleted: existing.length, deletedActivityDays: dailyActivity.length };
  },
});

export const sanitizeDuplicateHistoryEntries = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await sanitizeDuplicateHistoryEntriesImpl(ctx, args.dryRun ?? false);
  },
});

export const upsertHistoryBatch = mutation({
  args: {
    entries: v.array(historyEntryValidator),
  },
  handler: async (ctx, args) => {
    return await upsertHistoryEntries(ctx, args.entries);
  },
});

export const setCurrentWatching = mutation({
  args: {
    currentWatching: v.optional(currentWatchingValidator),
    syncedAtMs: v.number(),
  },
  handler: async (ctx, args) => {
    return await setCurrentWatchingState(ctx, args.currentWatching, args.syncedAtMs);
  },
});

export const getCurrentWatching = query({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db
      .query("traktState")
      .withIndex("by_key", (q: any) => q.eq("key", STATE_KEY))
      .unique();

    return state?.currentWatching ?? null;
  },
});

export const listHistoryEntries = query({
  args: {
    startMs: v.optional(v.number()),
    endMs: v.optional(v.number()),
    limit: v.optional(v.number()),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const order = args.order ?? "desc";
    let results = await ctx.db.query("traktHistoryEntries").withIndex("by_watchedAtMs").collect();

    results = results.filter((entry) => {
      if (args.startMs !== undefined && entry.watchedAtMs < args.startMs) return false;
      if (args.endMs !== undefined && entry.watchedAtMs >= args.endMs) return false;
      return true;
    });

    results.sort((left, right) =>
      order === "desc" ? right.watchedAtMs - left.watchedAtMs : left.watchedAtMs - right.watchedAtMs,
    );

    if (args.limit !== undefined) {
      return results.slice(0, args.limit);
    }

    return results;
  },
});

export const listDailyActivity = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("traktDailyActivity").withIndex("by_date").collect();

    return rows
      .filter((row) => {
        if (args.startDate && row.date < args.startDate) return false;
        if (args.endDate && row.date > args.endDate) return false;
        return true;
      })
      .sort((left, right) => left.date.localeCompare(right.date))
      .map(({ _id: _rowId, _creationTime: _rowCreationTime, ...row }) => row);
  },
});

export const getAuthStateInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db
      .query("traktAuthState")
      .withIndex("by_key", (q: any) => q.eq("key", STATE_KEY))
      .unique();

    if (!state) return null;

    return {
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      tokenType: state.tokenType,
      scope: state.scope,
      createdAtSeconds: state.createdAtSeconds,
      expiresInSeconds: state.expiresInSeconds,
      expiresAtMs: state.expiresAtMs,
    };
  },
});

export const setAuthStateInternal = internalMutation({
  args: authStateValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("traktAuthState")
      .withIndex("by_key", (q: any) => q.eq("key", STATE_KEY))
      .unique();

    const patch = {
      key: STATE_KEY,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenType: args.tokenType,
      scope: args.scope,
      createdAtSeconds: args.createdAtSeconds,
      expiresInSeconds: args.expiresInSeconds,
      expiresAtMs: args.expiresAtMs,
      updatedAtMs: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return { updated: true };
    }

    await ctx.db.insert("traktAuthState", patch);
    return { updated: true };
  },
});

export const storeBootstrapTokens = action({
  args: authStateValidator,
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.trakt.setAuthStateInternal, args);
    return { stored: true };
  },
});

async function runRecentSyncImpl(ctx: ActionCtx, windowHours: number): Promise<RecentSyncResult> {
  const clientId = getRequiredEnv("TRAKT_CLIENT_ID");
  const tmdbKey = process.env.TMDB_KEY;
  const startAtIso = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  let auth: TraktAuthState = await getValidAccessToken(ctx);
  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let deduped = 0;

  for (let page = 1; page <= 100; page += 1) {
    const url =
      `https://api.trakt.tv/sync/history?type=all&page=${page}&limit=100&start_at=${encodeURIComponent(startAtIso)}&extended=full,images`;

    let response: { status: number; data: TraktHistoryItem[] | null };
    try {
      response = await fetchTraktJson<TraktHistoryItem[]>(url, auth.accessToken, clientId);
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status === 401) {
        auth = await getValidAccessToken(ctx, true);
        response = await fetchTraktJson<TraktHistoryItem[]>(url, auth.accessToken, clientId);
      } else {
        throw error;
      }
    }

    const batch = response.data ?? [];
    if (!batch.length) break;

    const normalizedBatch: HistoryEntry[] = [];
    for (const item of batch) {
      const normalized = await normalizeHistoryItem(item, tmdbKey);
      if (normalized) normalizedBatch.push(normalized);
    }

    if (normalizedBatch.length) {
      const result = await ctx.runMutation(internal.trakt.upsertHistoryBatchInternal, {
        entries: normalizedBatch,
      });
      processed += normalizedBatch.length;
      inserted += result.inserted;
      updated += result.updated;
      skipped += result.skipped;
      deduped += result.deduped;
    }

    if (batch.length < 100) break;
  }

  let currentWatching: CurrentWatching | undefined;
  try {
    const watchingResponse: { status: number; data: TraktWatchingItem | null } = await fetchTraktJson<TraktWatchingItem>(
      "https://api.trakt.tv/users/me/watching?extended=full,images",
      auth.accessToken,
      clientId,
    );
    currentWatching = watchingResponse.data
      ? await normalizeCurrentWatching(watchingResponse.data, tmdbKey)
      : undefined;
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 401) {
      auth = await getValidAccessToken(ctx, true);
      const watchingResponse: { status: number; data: TraktWatchingItem | null } = await fetchTraktJson<TraktWatchingItem>(
        "https://api.trakt.tv/users/me/watching?extended=full,images",
        auth.accessToken,
        clientId,
      );
      currentWatching = watchingResponse.data
        ? await normalizeCurrentWatching(watchingResponse.data, tmdbKey)
        : undefined;
    } else {
      throw error;
    }
  }

  await ctx.runMutation(internal.trakt.setCurrentWatchingInternal, {
    currentWatching,
    syncedAtMs: Date.now(),
  });

  return {
    windowHours,
    processed,
    inserted,
    updated,
    skipped,
    deduped,
    currentWatching: currentWatching?.title ?? null,
  };
}

export const runRecentSync = action({
  args: {
    windowHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await runRecentSyncImpl(ctx, args.windowHours ?? 72);
  },
});

export const rebuildDailyActivity = action({
  args: {},
  handler: async (ctx) => {
    const entries = (await ctx.runQuery(api.trakt.listHistoryEntries, {
      order: "asc",
    })) as (HistoryEntry & { historyId: string })[];
    const totals = new Map<string, DailyActivityDelta>();
    for (const entry of entries) {
      addDailyActivityDelta(totals, toDailyActivityDelta(entry));
    }

    const updatedAtMs = Date.now();
    const rows = Array.from(totals.values())
      .filter((row) => row.totalSeconds > 0)
      .sort((left, right) => left.date.localeCompare(right.date))
      .map((row) => ({
        ...row,
        updatedAtMs,
      }));

    await ctx.runMutation(internal.trakt.replaceDailyActivityInternal, { rows });

    return {
      historyEntries: entries.length,
      days: rows.length,
    };
  },
});

export const upsertHistoryBatchInternal = internalMutation({
  args: {
    entries: v.array(historyEntryValidator),
  },
  handler: async (ctx, args) => {
    return await upsertHistoryEntries(ctx, args.entries);
  },
});

export const setCurrentWatchingInternal = internalMutation({
  args: {
    currentWatching: v.optional(currentWatchingValidator),
    syncedAtMs: v.number(),
  },
  handler: async (ctx, args) => {
    return await setCurrentWatchingState(ctx, args.currentWatching, args.syncedAtMs);
  },
});

export const replaceDailyActivityInternal = internalMutation({
  args: {
    rows: v.array(dailyActivityValidator),
  },
  handler: async (ctx, args) => {
    await replaceDailyActivity(ctx, args.rows);
    return { replaced: args.rows.length };
  },
});

export const getRecentSyncConfig = query({
  args: {},
  handler: async () => {
    return {
      windowHours: RECENT_SYNC_WINDOW_MS / (60 * 60 * 1000),
      refreshLeewayMinutes: TOKEN_REFRESH_LEEWAY_MS / (60 * 1000),
    };
  },
});
