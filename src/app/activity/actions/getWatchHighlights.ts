"use server";

import "server-only";

import { cookies } from "next/headers";
import { addMonths, startOfMonth, subDays } from "date-fns";

import { getTraktAccessToken } from "@/lib/traktAuth";

const TRAKT_ID = process.env.TRAKT_CLIENT_ID!;
const TMDB_KEY = process.env.TMDB_KEY;
const FALLBACK_POSTER = "/fallback-poster.jpg";

export type WatchCarouselItem = {
  id: string;
  title: string;
  subtitle?: string;
  posterUrl: string;
  href: string;
  meta?: string;
};

type AggregateEntry = {
  id: string;
  slug: string;
  type: "show" | "movie";
  title: string;
  minutes: number;
  plays: number;
  images?: any;
  tmdbId?: number | null;
};

const tmdbPosterCache = new Map<string, string>();

async function traktHeaders(): Promise<Record<string, string> | null> {
  const cookieToken = cookies().get("trakt_access_token")?.value;
  const token = cookieToken ?? (await getTraktAccessToken());

  if (!token) return null;

  return {
    "trakt-api-version": "2",
    "trakt-api-key": TRAKT_ID,
    Authorization: `Bearer ${token}`
  };
}

function clampSlug(prefix: string, slug?: string | null, fallback?: string) {
  if (slug && typeof slug === "string" && slug.length > 0) return slug;
  if (fallback) return `${prefix}-${fallback}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

async function fetchTmdbPoster(type: "movie" | "show", tmdbId?: number | null) {
  if (!tmdbId) return FALLBACK_POSTER;

  const cacheKey = `${type}-${tmdbId}`;
  const cached = tmdbPosterCache.get(cacheKey);
  if (cached) return cached;

  if (!TMDB_KEY) {
    tmdbPosterCache.set(cacheKey, FALLBACK_POSTER);
    return FALLBACK_POSTER;
  }

  const endpoint = type === "movie" ? "movie" : "tv";
  const res = await fetch(
    `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_KEY}&language=en-US`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) {
    tmdbPosterCache.set(cacheKey, FALLBACK_POSTER);
    return FALLBACK_POSTER;
  }

  const data = await res.json();
  const path = data?.poster_path;
  const url =
    typeof path === "string" && path.length
      ? `https://image.tmdb.org/t/p/w780${path}`
      : FALLBACK_POSTER;

  tmdbPosterCache.set(cacheKey, url);
  return url;
}

async function resolvePoster(
  type: "movie" | "show",
  images?: any,
  tmdbId?: number | null
) {
  if (tmdbId) {
    const tmdbPoster = await fetchTmdbPoster(type, tmdbId);
    if (tmdbPoster !== FALLBACK_POSTER) return tmdbPoster;
  }

  const poster =
    images?.poster?.full ??
    images?.poster?.medium ??
    images?.poster?.thumb ??
    images?.thumb?.full ??
    images?.thumb?.medium ??
    images?.thumb?.thumb;

  if (typeof poster === "string" && poster.length) return poster;

  return FALLBACK_POSTER;
}

async function resolvePosterFromHistory(item: any) {
  if (item?.type === "movie" && item.movie) {
    return resolvePoster("movie", item.movie.images, item.movie.ids?.tmdb);
  }

  if (item?.show) {
    return resolvePoster("show", item.show.images, item.show.ids?.tmdb);
  }

  return FALLBACK_POSTER;
}

function formatMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function formatWatchedAt(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return undefined;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
  }).format(date);
}

export async function getRecentlyWatched(limit = 12): Promise<WatchCarouselItem[]> {
  const headers = await traktHeaders();
  if (!headers) return [];

  const res = await fetch(
    `https://api.trakt.tv/sync/history?limit=${limit}&page=1&extended=full,images`,
    { headers, next: { revalidate: 600 } }
  );
  if (!res.ok) return [];

  const data = (await res.json()) as any[];

  const items = await Promise.all(
    data.map(async item => {
      const type = item?.type;
      const watchedAt = item?.watched_at;
      const posterUrl = await resolvePosterFromHistory(item);

      const meta = formatWatchedAt(watchedAt);

      if (type === "movie" && item.movie) {
        const slug = clampSlug("movie", item.movie.ids?.slug, String(item.movie.ids?.trakt ?? item.movie.ids?.tmdb));
        return {
          id: `movie-${slug}-${watchedAt ?? "unknown"}`,
          title: item.movie.title ?? "Untitled movie",
          subtitle: item.movie.year ? String(item.movie.year) : undefined,
          posterUrl,
          href: `https://trakt.tv/movies/${slug}`,
          meta
        };
      }

      if (type === "episode" && item.show && item.episode) {
        const slug = clampSlug("show", item.show.ids?.slug, String(item.show.ids?.trakt ?? item.show.ids?.tmdb));
        const season = item.episode.season;
        const episode = item.episode.number;

        const parts: string[] = [];
        if (typeof season === "number") parts.push(`S${String(season).padStart(2, "0")}`);
        if (typeof episode === "number") parts.push(`E${String(episode).padStart(2, "0")}`);

        const code = parts.join("");
        const episodeTitle = item.episode.title;
        const subtitle = [code, episodeTitle]
          .filter(Boolean)
          .join(" • ") || undefined;

        const href =
          slug && typeof season === "number" && typeof episode === "number"
            ? `https://trakt.tv/shows/${slug}/seasons/${season}/episodes/${episode}`
            : slug
              ? `https://trakt.tv/shows/${slug}`
              : "#";

        return {
          id: `episode-${slug}-${season ?? "x"}-${episode ?? "y"}-${watchedAt ?? "unknown"}`,
          title: item.show.title ?? episodeTitle ?? "Untitled episode",
          subtitle,
          posterUrl,
          href,
          meta
        };
      }

      if (type === "show" && item.show) {
        const slug = clampSlug("show", item.show.ids?.slug, String(item.show.ids?.trakt ?? item.show.ids?.tmdb));
        return {
          id: `show-${slug}-${watchedAt ?? "unknown"}`,
          title: item.show.title ?? "Untitled show",
          subtitle: item.show.year ? String(item.show.year) : undefined,
          posterUrl,
          href: `https://trakt.tv/shows/${slug}`,
          meta
        };
      }

      // Unknown fallback entry
      return {
        id: `unknown-${Math.random().toString(36).slice(2, 10)}`,
        title: "Untitled",
        posterUrl,
        href: "#",
        meta
      };
    })
  );

  return items.slice(0, limit);
}

export async function getMostWatchedPast30Days(limit = 12): Promise<WatchCarouselItem[]> {
  const headers = await traktHeaders();
  if (!headers) return [];
  const since = subDays(new Date(), 30);
  const sinceIso = since.toISOString();

  const aggregates = new Map<string, AggregateEntry>();

  for (let page = 1; page <= 10; page++) {
    const url =
      "https://api.trakt.tv/sync/history" +
      `?type=all&page=${page}&limit=100&extended=full,images&start_at=${encodeURIComponent(sinceIso)}`;

    const res = await fetch(url, { headers, next: { revalidate: 1800 } });
    if (!res.ok) break;

    const data = (await res.json()) as any[];
    if (!data.length) break;

    for (const item of data) {
      const watchedAt = new Date(item?.watched_at ?? 0);
      if (Number.isFinite(watchedAt.valueOf()) && watchedAt < since) continue;

      if (item?.type === "movie" && item.movie) {
        const slug = clampSlug("movie", item.movie.ids?.slug, String(item.movie.ids?.trakt ?? item.movie.ids?.tmdb));
        const key = `movie-${slug}`;
        const runtime = Number(item.movie.runtime) || 0;

        const entry =
          aggregates.get(key) ??
          {
            id: key,
            slug,
            type: "movie" as const,
            title: item.movie.title ?? "Untitled movie",
            minutes: 0,
            plays: 0,
            images: item.movie.images,
            tmdbId: item.movie.ids?.tmdb
          };

        entry.minutes += runtime;
        entry.plays += 1;
        if (!entry.images && item.movie.images) entry.images = item.movie.images;
        if (!entry.tmdbId && item.movie.ids?.tmdb) entry.tmdbId = item.movie.ids?.tmdb;
        aggregates.set(key, entry);
        continue;
      }

      if (item?.show) {
        const slug = clampSlug("show", item.show.ids?.slug, String(item.show.ids?.trakt ?? item.show.ids?.tmdb));
        const key = `show-${slug}`;
        const runtime = Number(item.show?.runtime ?? item.episode?.runtime) || 0;

        const entry =
          aggregates.get(key) ??
          {
            id: key,
            slug,
            type: "show" as const,
            title: item.show.title ?? item.episode?.title ?? "Untitled show",
            minutes: 0,
            plays: 0,
            images: item.show.images,
            tmdbId: item.show.ids?.tmdb
          };

        entry.minutes += runtime;
        entry.plays += 1;
        if (!entry.images && item.show.images) entry.images = item.show.images;
        if (!entry.tmdbId && item.show.ids?.tmdb) entry.tmdbId = item.show.ids?.tmdb;
        aggregates.set(key, entry);
      }
    }

    if (data.length < 100) break;
  }

  const top = Array.from(aggregates.values())
    .filter(item => item.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, limit);

  return Promise.all(
    top.map(async item => {
      const posterUrl = await resolvePoster(item.type, item.images, item.tmdbId);
      const href =
        item.type === "movie"
          ? `https://trakt.tv/movies/${item.slug}`
          : `https://trakt.tv/shows/${item.slug}`;

      const playsLabel = `${item.plays} ${item.plays === 1 ? "play" : "plays"}`;
      const meta = `${formatMinutes(item.minutes)} watched • ${playsLabel}`;

      return {
        id: `${item.id}-30d`,
        title: item.title,
        posterUrl,
        href,
        meta
      };
    })
  );
}

export async function getMostWatchedAllTime(limit = 12): Promise<WatchCarouselItem[]> {
  const headers = await traktHeaders();
  if (!headers) return [];

  const [showsRes, moviesRes] = await Promise.all([
    fetch(
      "https://api.trakt.tv/users/me/watched/shows?extended=full,images",
      { headers, next: { revalidate: 86400 } }
    ),
    fetch(
      "https://api.trakt.tv/users/me/watched/movies?extended=full,images",
      { headers, next: { revalidate: 86400 } }
    )
  ]);

  const showEntries: AggregateEntry[] = [];
  const movieEntries: AggregateEntry[] = [];

  if (showsRes.ok) {
    const shows = (await showsRes.json()) as any[];
    for (const entry of shows ?? []) {
      if (!entry?.show) continue;
      const slug = clampSlug("show", entry.show.ids?.slug, String(entry.show.ids?.trakt ?? entry.show.ids?.tmdb));
      const plays = Number(entry.plays) || 0;
      const runtime = Number(entry.show.runtime) || 0;
      const minutes = plays * runtime;

      showEntries.push({
        id: `show-${slug}`,
        slug,
        type: "show",
        title: entry.show.title ?? "Untitled show",
        minutes,
        plays,
        images: entry.show.images,
        tmdbId: entry.show.ids?.tmdb
      });
    }
  }

  if (moviesRes.ok) {
    const movies = (await moviesRes.json()) as any[];
    for (const entry of movies ?? []) {
      if (!entry?.movie) continue;
      const slug = clampSlug("movie", entry.movie.ids?.slug, String(entry.movie.ids?.trakt ?? entry.movie.ids?.tmdb));
      const plays = Number(entry.plays) || 0;
      const runtime = Number(entry.movie.runtime) || 0;
      const minutes = plays * runtime;

      movieEntries.push({
        id: `movie-${slug}`,
        slug,
        type: "movie",
        title: entry.movie.title ?? "Untitled movie",
        minutes,
        plays,
        images: entry.movie.images,
        tmdbId: entry.movie.ids?.tmdb
      });
    }
  }

  const combined = [...showEntries, ...movieEntries]
    .filter(entry => entry.minutes > 0);

  combined.sort((a, b) => b.minutes - a.minutes);

  const top = combined.slice(0, limit);

  return Promise.all(
    top.map(async item => {
      const posterUrl = await resolvePoster(item.type, item.images, item.tmdbId);
      const href =
        item.type === "movie"
          ? `https://trakt.tv/movies/${item.slug}`
          : `https://trakt.tv/shows/${item.slug}`;
      const playsLabel = `${item.plays} ${item.plays === 1 ? "play" : "plays"}`;
      const meta = `${formatMinutes(item.minutes)} watched • ${playsLabel}`;

      return {
        id: `${item.id}-all-time`,
        title: item.title,
        posterUrl,
        href,
        meta
      };
    })
  );
}

export async function getMostWatchedForMonth(
  monthIso: string,
  limit = 12
): Promise<WatchCarouselItem[]> {
  const monthDate = startOfMonth(new Date(monthIso));
  if (!Number.isFinite(monthDate.valueOf())) return [];

  const monthKey = `${monthDate.getUTCFullYear()}-${String(
    monthDate.getUTCMonth() + 1
  ).padStart(2, "0")}`;

  const rangeStart = new Date(
    Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1, 0, 0, 0)
  );
  const rangeEnd = addMonths(rangeStart, 1);

  const headers = await traktHeaders();
  if (!headers) return [];
  const aggregates = new Map<string, AggregateEntry>();

  for (let page = 1; page <= 12; page++) {
    const url =
      "https://api.trakt.tv/sync/history" +
      `?type=all&page=${page}&limit=100&extended=full,images` +
      `&start_at=${encodeURIComponent(rangeStart.toISOString())}` +
      `&end_at=${encodeURIComponent(rangeEnd.toISOString())}`;

    const res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!res.ok) break;

    const data = (await res.json()) as any[];
    if (!data.length) break;

    for (const item of data) {
      const watchedAt = new Date(item?.watched_at ?? 0);
      if (
        !Number.isFinite(watchedAt.valueOf()) ||
        watchedAt < rangeStart ||
        watchedAt >= rangeEnd
      ) {
        continue;
      }

      if (item?.type === "movie" && item.movie) {
        const slug = clampSlug(
          "movie",
          item.movie.ids?.slug,
          String(item.movie.ids?.trakt ?? item.movie.ids?.tmdb)
        );
        const key = `movie-${slug}`;
        const runtime = Number(item.movie.runtime) || 0;

        const entry =
          aggregates.get(key) ??
          {
            id: key,
            slug,
            type: "movie" as const,
            title: item.movie.title ?? "Untitled movie",
            minutes: 0,
            plays: 0,
            images: item.movie.images,
            tmdbId: item.movie.ids?.tmdb
          };

        entry.minutes += runtime;
        entry.plays += 1;
        if (!entry.images && item.movie.images) entry.images = item.movie.images;
        if (!entry.tmdbId && item.movie.ids?.tmdb) entry.tmdbId = item.movie.ids?.tmdb;
        aggregates.set(key, entry);
        continue;
      }

      if (item?.show) {
        const slug = clampSlug(
          "show",
          item.show.ids?.slug,
          String(item.show.ids?.trakt ?? item.show.ids?.tmdb)
        );
        const key = `show-${slug}`;
        const runtime =
          Number(item.show?.runtime ?? item.episode?.runtime ?? 0) || 0;

        const entry =
          aggregates.get(key) ??
          {
            id: key,
            slug,
            type: "show" as const,
            title: item.show.title ?? item.episode?.title ?? "Untitled show",
            minutes: 0,
            plays: 0,
            images: item.show.images,
            tmdbId: item.show.ids?.tmdb
          };

        entry.minutes += runtime;
        entry.plays += 1;
        if (!entry.images && item.show.images) entry.images = item.show.images;
        if (!entry.tmdbId && item.show.ids?.tmdb) entry.tmdbId = item.show.ids?.tmdb;
        aggregates.set(key, entry);
      }
    }

    if (data.length < 100) break;
  }

  const top = Array.from(aggregates.values())
    .filter(item => item.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, limit);

  return Promise.all(
    top.map(async item => {
      const posterUrl = await resolvePoster(item.type, item.images, item.tmdbId);
      const href =
        item.type === "movie"
          ? `https://trakt.tv/movies/${item.slug}`
          : `https://trakt.tv/shows/${item.slug}`;
      const playsLabel = `${item.plays} ${item.plays === 1 ? "play" : "plays"}`;
      const meta = `${formatMinutes(item.minutes)} watched • ${playsLabel}`;

      return {
        id: `${item.id}-${monthKey}`,
        title: item.title,
        posterUrl,
        href,
        meta
      };
    })
  );
}
