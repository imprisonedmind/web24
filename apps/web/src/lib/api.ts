import { queryOptions } from "@tanstack/react-query";
import type { ExtendedRecordMap } from "notion-types";

import type { WatchDay, WatchedItem } from "../types";

export type TvEntry = {
  type: "movie" | "show" | "episode";
  title: string;
  showTitle?: string;
  episodeTitle?: string;
  season?: number;
  episode?: number;
  posterUrl: string;
  url: string;
  progress?: number;
  watchedAt?: string;
};

export type TvStatus = {
  currentlyWatching: TvEntry | null;
  lastWatched: TvEntry | null;
};

export type RecentlyPlayedTrack = {
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
  playedAt?: string;
  durationMs?: number;
};

export type SongData = {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
  playedAt?: string;
  recentlyPlayed?: RecentlyPlayedTrack[];
  durationMs?: number;
  progressMs?: number;
};

async function fetchJson<T>(input: string) {
  const response = await fetch(input, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${input}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export const homeActivityQueryOptions = queryOptions({
  queryKey: ["activity", "home"],
  queryFn: async () => {
    const payload = await fetchJson<{ days?: WatchDay[] }>("/api/activity/home");
    return payload.days ?? [];
  },
});

export const fullActivityQueryOptions = queryOptions({
  queryKey: ["activity", "full"],
  queryFn: async () => {
    return fetchJson<{
      watchingDays?: WatchDay[];
      workSections?: { label: string; days: WatchDay[] }[];
    }>("/api/activity/full");
  },
  refetchInterval: 30_000,
});

export const watchedOverviewQueryOptions = queryOptions({
  queryKey: ["watched", "overview"],
  queryFn: async () => {
    const [recent, month, allTime] = await Promise.all([
      fetchJson<{ items?: WatchedItem[] }>("/api/watched/recent?limit=12"),
      fetchJson<{ items?: WatchedItem[] }>("/api/watched/month?limit=12"),
      fetchJson<{ items?: WatchedItem[] }>("/api/watched/all-time?limit=12"),
    ]);

    return {
      recentItems: recent.items ?? [],
      monthItems: month.items ?? [],
      allTimeItems: allTime.items ?? [],
    };
  },
});

export function watchedListQueryOptions(
  scope: "recent" | "month" | "all-time",
  limit: number,
) {
  return queryOptions({
    queryKey: ["watched", scope, limit],
    queryFn: async () => {
      const payload = await fetchJson<{ items?: WatchedItem[] }>(`/api/watched/${scope}?limit=${limit}`);
      return payload.items ?? [];
    },
  });
}

export function watchedMonthlyQueryOptions(monthIso: string, limit: number) {
  return queryOptions({
    queryKey: ["watched", "monthly", monthIso, limit],
    queryFn: async () => {
      const payload = await fetchJson<{ items?: WatchedItem[] }>(
        `/api/watched/monthly?monthIso=${encodeURIComponent(monthIso)}&limit=${limit}`,
      );
      return payload.items ?? [];
    },
  });
}

export const tvStatusQueryOptions = queryOptions({
  queryKey: ["tv", "status"],
  queryFn: async () => fetchJson<TvStatus>("/api/tv/status"),
  refetchInterval: 30_000,
});

export const musicQueryOptions = queryOptions({
  queryKey: ["music", "currently-playing"],
  queryFn: async () => fetchJson<SongData | null>("/api/currentlyPlaying"),
  refetchInterval: 45_000,
});

export function writingRecordMapQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["writing", id],
    queryFn: async () => {
      const payload = await fetchJson<{ recordMap: ExtendedRecordMap | null }>(`/api/writing/${id}`);
      return payload.recordMap;
    }
  });
}
