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
