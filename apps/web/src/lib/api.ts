import { queryOptions } from "@tanstack/react-query";
import type { ExtendedRecordMap } from "notion-types";

import type { ReadingItem, WatchDay, WatchedItem } from "../types";

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

export type ReadingStatus = {
  title: string;
  author?: string;
  coverUrl?: string;
  progressPercent: number;
  lastReadDate?: string;
  status: "completed" | "in_progress";
  totalReadingSeconds: number;
  totalWordsRead: number;
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

export type GamingStatus = {
  currentGame: { gameId: string; title: string; startedAtMs: number; heartbeatAtMs: number; coverUrl?: string } | null;
  lastSession: { gameId: string; title: string; startedAtMs: number; endedAtMs: number; durationSeconds: number; coverUrl?: string } | null;
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
    try {
      const payload = await fetchJson<{ days?: WatchDay[] }>("/api/activity/home");
      return payload.days ?? [];
    } catch (error) {
      console.warn("[home-activity] request failed; rendering unavailable state", error);
      return null as WatchDay[] | null;
    }
  },
  retry: false,
});

export type HomeHeroHealthStats = {
  heartRateBpm: number | null;
  steps: number | null;
  date: string | null;
};

export const homeHeroHealthStatsQueryOptions = queryOptions({
  queryKey: ["activity", "home", "hero"],
  queryFn: async () => {
    try {
      return await fetchJson<HomeHeroHealthStats>("/api/activity/home/hero");
    } catch (error) {
      console.warn("[home-hero-health] request failed; rendering fallback stats", error);
      return { heartRateBpm: null, steps: null, date: null } satisfies HomeHeroHealthStats;
    }
  },
  retry: false,
});

export const fullActivityQueryOptions = queryOptions({
  queryKey: ["activity", "full"],
  queryFn: async () => {
    return fetchJson<{
      watchingDays?: WatchDay[];
      workSections?: { label: string; days: WatchDay[] }[];
      healthSections?: { label: string; days: WatchDay[] }[];
      readingSections?: { label: string; days: WatchDay[] }[];
    }>("/api/activity/full");
  },
  refetchInterval: 30_000,
});

export const activityWatchingQueryOptions = queryOptions({
  queryKey: ["activity", "watching"],
  queryFn: async () => {
    const payload = await fetchJson<{ watchingDays?: WatchDay[] }>("/api/activity/watching");
    return payload.watchingDays ?? [];
  },
  refetchInterval: 30_000,
});

export const activityWorkQueryOptions = queryOptions({
  queryKey: ["activity", "work"],
  queryFn: async () => {
    const payload = await fetchJson<{ workSections?: { label: string; days: WatchDay[] }[] }>(
      "/api/activity/work",
    );
    return payload.workSections ?? [];
  },
  refetchInterval: 30_000,
});

export const activityHealthQueryOptions = queryOptions({
  queryKey: ["activity", "health"],
  queryFn: async () => {
    const payload = await fetchJson<{ healthSections?: { label: string; days: WatchDay[] }[] }>(
      "/api/activity/health",
    );
    return payload.healthSections ?? [];
  },
  refetchInterval: 30_000,
});

export const activityReadingQueryOptions = queryOptions({
  queryKey: ["activity", "reading"],
  queryFn: async () => {
    const payload = await fetchJson<{ readingSections?: { label: string; days: WatchDay[] }[] }>(
      "/api/activity/reading",
    );
    return payload.readingSections ?? [];
  },
  refetchInterval: 30_000,
});

export const activityGamingQueryOptions = queryOptions({
  queryKey: ["activity", "gaming"],
  queryFn: async () => {
    const payload = await fetchJson<{ gamingSections?: { label: string; days: WatchDay[] }[] }>("/api/activity/gaming");
    return payload.gamingSections ?? [];
  },
  refetchInterval: 30_000,
});

export const gamingStatusQueryOptions = queryOptions({
  queryKey: ["gaming", "status"],
  queryFn: async () => fetchJson<GamingStatus>("/api/gaming/status"),
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

export const readingStatusQueryOptions = queryOptions({
  queryKey: ["reading", "status"],
  queryFn: async () => fetchJson<ReadingStatus | null>("/api/reading/status"),
  refetchInterval: 30_000,
});

export const readingOverviewQueryOptions = queryOptions({
  queryKey: ["reading", "overview"],
  queryFn: async () => {
    return fetchJson<{
      currentItems?: ReadingItem[];
      finishedItems?: ReadingItem[];
      sessionItems?: ReadingItem[];
    }>("/api/reading/overview");
  },
});

export function readingListQueryOptions(
  scope: "current" | "finished" | "sessions",
  limit: number,
) {
  return queryOptions({
    queryKey: ["reading", scope, limit],
    queryFn: async () => {
      const payload = await fetchJson<{ items?: ReadingItem[] }>(`/api/reading/${scope}?limit=${limit}`);
      return payload.items ?? [];
    },
  });
}

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
