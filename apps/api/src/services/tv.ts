import { getSyncedCurrentlyWatching, listSyncedHistoryEntries } from "../lib/convex";

export type CurrentlyWatching = {
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

export type LastWatched = {
  type: "movie" | "show" | "episode";
  title: string;
  showTitle?: string;
  episodeTitle?: string;
  season?: number;
  episode?: number;
  posterUrl: string;
  watchedAt: string;
  url: string;
};

export async function getCurrentlyWatching(_cookieHeader?: string | null) {
  return (await getSyncedCurrentlyWatching()) satisfies CurrentlyWatching | null;
}

export async function getLastWatched(_cookieHeader?: string | null) {
  const [entry] = await listSyncedHistoryEntries({ limit: 1, order: "desc" });
  if (!entry) return null;

  return {
    type: entry.entryType,
    title: entry.title,
    showTitle: entry.showTitle,
    episodeTitle: entry.episodeTitle,
    season: entry.season,
    episode: entry.episode,
    watchedAt: entry.watchedAt,
    posterUrl: entry.posterUrl,
    url: entry.href,
  } satisfies LastWatched;
}
