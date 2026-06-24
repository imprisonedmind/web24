import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../convex/_generated/api";
import { AsyncCache } from "./cache";

export type SyncedHistoryEntry = {
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

export type SyncedCurrentlyWatching = {
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

export type SyncedDailyActivity = {
  date: string;
  totalSeconds: number;
  movieSeconds: number;
  episodeSeconds: number;
  updatedAtMs: number;
};

export type SyncedCodingDailyActivity = {
  date: string;
  total: number;
  categories: {
    name: string;
    total: number;
  }[];
  updatedAtMs: number;
};

export type SyncedHealthDailyActivity = {
  date: string;
  totalSeconds: number;
  steps: number;
  distanceMeters: number;
  activeCaloriesKcal: number;
  exerciseSeconds: number;
  sleepSeconds: number;
  exerciseSessions: number;
  sleepSessions: number;
  heartRateLatestBpm?: number;
  heartRateLatestAtMs?: number;
  heartRateAvgBpm?: number;
  activityCategories?: {
    kind: "exercise" | "sleep";
    name: string;
    total: number;
    distanceMeters?: number;
    steps?: number;
    caloriesKcal?: number;
    heartRateAvgBpm?: number;
    heartRateMaxBpm?: number;
  }[];
  updatedAtMs: number;
};

export type SyncedWatchAggregate = {
  id: string;
  type: "show" | "movie";
  title: string;
  minutes: number;
  plays: number;
  posterUrl: string;
  href: string;
};

export type SyncedHealthCurrentStats = {
  date: string;
  steps?: number;
  heartRateBpm?: number;
  heartRateAtMs?: number;
  sources: string[];
  updatedAtMs: number;
};

export type SyncedReadingActivity = {
  books: {
    source: string;
    sourceId: string;
    title: string;
    filename: string;
    author?: string;
    category?: string;
    coverUrl?: string;
    status: "completed" | "in_progress";
    progressPercent: number;
    totalReadingSeconds: number;
    totalWordsRead: number;
    activeDays: number;
    firstReadDate?: string;
    lastReadDate?: string;
    updatedAtMs: number;
  }[];
  dailyActivity: {
    date: string;
    totalReadingSeconds: number;
    totalWordsRead: number;
    bookCount: number;
    source: string;
    updatedAtMs: number;
  }[];
  bookDailyActivity: {
    sourceId: string;
    date: string;
    title: string;
    filename: string;
    readingSeconds: number;
    wordsRead: number;
    progressPercent: number;
    source: string;
    updatedAtMs: number;
  }[];
  state: {
    key: string;
    source: string;
    syncedAtMs: number;
    backupPath?: string;
    backupModifiedAt?: string;
    backupContentHash?: string;
    books: number;
    dailyRows: number;
    bookDailyRows: number;
  } | null;
};

export type SyncedGamingStatus = {
  currentGame: { gameId: string; title: string; executable: string; platform: string; startedAtMs: number; heartbeatAtMs: number; coverUrl?: string } | null;
  lastSession: { externalId: string; gameId: string; title: string; executable: string; platform: string; startedAtMs: number; endedAtMs: number; durationSeconds: number; source: string; updatedAtMs: number; coverUrl?: string } | null;
};

let client: ConvexHttpClient | null = null;
const CONVEX_QUERY_TTL_MS = 60_000;
const CONVEX_QUERY_STALE_MS = 5 * 60_000;
const convexQueryCache = new AsyncCache<unknown>();

function getConvexUrl() {
  const value = process.env.CONVEX_URL;

  if (!value) {
    throw new Error("Missing CONVEX_URL for Convex-backed reads");
  }

  return value;
}

function getClient() {
  if (!client) {
    client = new ConvexHttpClient(getConvexUrl());
  }
  return client;
}

function cacheKey(prefix: string, args?: Record<string, unknown>) {
  return `${prefix}:${JSON.stringify(args ?? {})}`;
}

async function cachedConvexQuery<T>(key: string, loader: () => Promise<T>) {
  return (await convexQueryCache.getOrRefresh({
    key,
    ttlMs: CONVEX_QUERY_TTL_MS,
    staleWhileRevalidateMs: CONVEX_QUERY_STALE_MS,
    loader,
  })) as T;
}

export async function getSyncedCurrentlyWatching() {
  return cachedConvexQuery(
    "trakt:current-watching",
    async () => (await getClient().query(api.trakt.getCurrentWatching, {})) as SyncedCurrentlyWatching | null,
  );
}

export async function listSyncedHistoryEntries(args?: {
  startMs?: number;
  endMs?: number;
  limit?: number;
  order?: "asc" | "desc";
}) {
  return cachedConvexQuery(
    cacheKey("trakt:history", args),
    async () => (await getClient().query(api.trakt.listHistoryEntries, args ?? {})) as SyncedHistoryEntry[],
  );
}

export async function listSyncedMostWatchedAggregates(args?: {
  startMs?: number;
  endMs?: number;
  limit?: number;
}) {
  return cachedConvexQuery(
    cacheKey("trakt:most-watched", args),
    async () =>
      (await getClient().query(api.trakt.listMostWatchedAggregates, args ?? {})) as SyncedWatchAggregate[],
  );
}

export async function getSyncedHistoryVersion() {
  const [latest] = await listSyncedHistoryEntries({ limit: 1, order: "desc" });
  if (!latest) return "empty";
  return `${latest.historyId}:${latest.watchedAtMs}`;
}

export async function listSyncedDailyActivity(args?: {
  startDate?: string;
  endDate?: string;
}) {
  return cachedConvexQuery(
    cacheKey("trakt:daily-activity", args),
    async () => (await getClient().query(api.trakt.listDailyActivity, args ?? {})) as SyncedDailyActivity[],
  );
}

export async function listSyncedCodingDailyActivity(args?: {
  startDate?: string;
  endDate?: string;
}) {
  return cachedConvexQuery(
    cacheKey("coding:daily-activity", args),
    async () => (await getClient().query(api.coding.listDailyActivity, args ?? {})) as SyncedCodingDailyActivity[],
  );
}

export async function listSyncedHealthDailyActivity(args?: {
  startDate?: string;
  endDate?: string;
}) {
  return cachedConvexQuery(
    cacheKey("health:daily-activity", args),
    async () => (await getClient().query(api.health.listDailyActivity, args ?? {})) as SyncedHealthDailyActivity[],
  );
}

export async function getSyncedHealthCurrentStats() {
  return cachedConvexQuery(
    "health:current-stats",
    async () => (await getClient().query(api.health.getCurrentStats, {})) as SyncedHealthCurrentStats | null,
  );
}

export async function getSyncedHealthVersion() {
  return cachedConvexQuery(
    "health:sync-version",
    async () => (await getClient().query(api.health.getSyncVersion, {})) as string,
  );
}

export async function listSyncedReadingActivity(args?: {
  startDate?: string;
  endDate?: string;
  cacheVersion?: string;
}) {
  const { cacheVersion, ...queryArgs } = args ?? {};
  return cachedConvexQuery(
    cacheKey("reading:activity", { ...queryArgs, cacheVersion }),
    async () => (await getClient().query(api.reading.listReadingActivity, queryArgs)) as SyncedReadingActivity,
  );
}

export async function getSyncedReadingVersion() {
  return cachedConvexQuery(
    "reading:sync-version",
    async () => (await getClient().query(api.reading.getSyncVersion, {})) as string,
  );
}

export async function listSyncedGamingDailyActivity(args?: { startDate?: string; endDate?: string }) {
  return cachedConvexQuery(
    cacheKey("gaming:daily-activity", args),
    async () => getClient().query(api.gaming.listDailyActivity, args ?? {}),
  );
}

export async function getSyncedGamingStatus() {
  const status = await cachedConvexQuery(
    "gaming:status",
    async () => (await getClient().query(api.gaming.getStatus, {})) as SyncedGamingStatus,
  );
  const game = status.currentGame ?? status.lastSession;
  if (!game || game.coverUrl) return status;
  const coverUrl = await getClient().action(api.gaming.resolveCover, { title: game.title, platform: game.platform });
  if (!coverUrl) return status;
  return status.currentGame
    ? { ...status, currentGame: { ...status.currentGame, coverUrl } }
    : { ...status, lastSession: status.lastSession ? { ...status.lastSession, coverUrl } : null };
}

export async function getSyncedGamingVersion() {
  return cachedConvexQuery(
    "gaming:sync-version",
    async () => getClient().query(api.gaming.getSyncVersion, {}),
  );
}
