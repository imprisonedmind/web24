import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../convex/_generated/api";

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

export type SyncedHealthCurrentStats = {
  date: string;
  steps?: number;
  heartRateBpm?: number;
  heartRateAtMs?: number;
  sources: string[];
  updatedAtMs: number;
};

let client: ConvexHttpClient | null = null;

function getConvexUrl() {
  const value =
    process.env.VITE_CONVEX_URL ??
    process.env.CONVEX_URL ??
    process.env.CONVEX_SITE_URL;

  if (!value) {
    throw new Error("Missing VITE_CONVEX_URL/CONVEX_URL for Convex-backed Trakt reads");
  }

  return value;
}

function getClient() {
  if (!client) {
    client = new ConvexHttpClient(getConvexUrl());
  }
  return client;
}

export async function getSyncedCurrentlyWatching() {
  return (await getClient().query(api.trakt.getCurrentWatching, {})) as SyncedCurrentlyWatching | null;
}

export async function listSyncedHistoryEntries(args?: {
  startMs?: number;
  endMs?: number;
  limit?: number;
  order?: "asc" | "desc";
}) {
  return (await getClient().query(api.trakt.listHistoryEntries, args ?? {})) as SyncedHistoryEntry[];
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
  return (await getClient().query(api.trakt.listDailyActivity, args ?? {})) as SyncedDailyActivity[];
}

export async function listSyncedHealthDailyActivity(args?: {
  startDate?: string;
  endDate?: string;
}) {
  return (await getClient().query(api.health.listDailyActivity, args ?? {})) as SyncedHealthDailyActivity[];
}

export async function getSyncedHealthCurrentStats() {
  return (await getClient().query(api.health.getCurrentStats, {})) as SyncedHealthCurrentStats | null;
}

export async function getSyncedHealthVersion() {
  return (await getClient().query(api.health.getSyncVersion, {})) as string;
}
