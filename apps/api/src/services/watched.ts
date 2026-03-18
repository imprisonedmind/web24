import { getTraktAccessToken } from "../lib/traktAuth";

const FALLBACK_POSTER = "/fallback-poster.jpg";

export type WatchCardItem = {
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

type WatchDay = {
  date: string;
  total: number;
  categories: { name: string; total: number }[];
};

function parseCookie(cookieHeader?: string | null, key = "trakt_access_token") {
  if (!cookieHeader) return null;

  const pair = cookieHeader
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${key}=`));

  return pair ? decodeURIComponent(pair.split("=").slice(1).join("=")) : null;
}

function getEnv(key: string) {
  return process.env[key] ?? process.env[key.toLowerCase()] ?? process.env[key.toUpperCase()];
}

function traktHeaders(accessToken: string) {
  const clientId = getEnv("TRAKT_CLIENT_ID");
  if (!clientId) throw new Error("Missing TRAKT_CLIENT_ID");

  return {
    Authorization: `Bearer ${accessToken}`,
    "trakt-api-key": clientId,
    "trakt-api-version": "2"
  };
}

async function fetchTmdbPoster(type: "movie" | "show", tmdbId?: number | null) {
  const key = getEnv("TMDB_KEY");
  if (!tmdbId || !key) return FALLBACK_POSTER;

  const endpoint = type === "movie" ? "movie" : "tv";
  const response = await fetch(
    `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${key}&language=en-US`
  );

  if (!response.ok) return FALLBACK_POSTER;

  const data = (await response.json()) as { poster_path?: string | null };
  return typeof data.poster_path === "string" && data.poster_path.length
    ? `https://image.tmdb.org/t/p/w780${data.poster_path}`
    : FALLBACK_POSTER;
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

  return typeof poster === "string" && poster.length ? poster : FALLBACK_POSTER;
}

function formatMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function clampSlug(prefix: string, slug?: string | null, fallback?: string) {
  if (slug && typeof slug === "string" && slug.length > 0) return slug;
  if (fallback) return `${prefix}-${fallback}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
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

export async function getRecentlyWatched(limit = 12, cookieHeader?: string | null) {
  const accessToken = await getTraktAccessToken(parseCookie(cookieHeader));
  if (!accessToken) return [] satisfies WatchCardItem[];

  const response = await fetch(
    `https://api.trakt.tv/sync/history?limit=${limit}&page=1&extended=full,images`,
    { headers: traktHeaders(accessToken) }
  );

  if (!response.ok) return [] satisfies WatchCardItem[];

  const data = (await response.json()) as any[];

  return Promise.all(
    data.slice(0, limit).map(async item => {
      const type = item?.type;
      const watchedAt = item?.watched_at;
      const meta = formatWatchedAt(watchedAt);

      if (type === "movie" && item.movie) {
        const slug = clampSlug(
          "movie",
          item.movie.ids?.slug,
          String(item.movie.ids?.trakt ?? item.movie.ids?.tmdb)
        );

        return {
          id: `movie-${slug}-${watchedAt ?? "unknown"}`,
          title: item.movie.title ?? "Untitled movie",
          subtitle: item.movie.year ? String(item.movie.year) : undefined,
          posterUrl: await resolvePoster("movie", item.movie.images, item.movie.ids?.tmdb),
          href: `https://trakt.tv/movies/${slug}`,
          meta
        } satisfies WatchCardItem;
      }

      if (type === "episode" && item.show && item.episode) {
        const slug = clampSlug(
          "show",
          item.show.ids?.slug,
          String(item.show.ids?.trakt ?? item.show.ids?.tmdb)
        );
        const season = item.episode.season;
        const episode = item.episode.number;
        const code =
          typeof season === "number" && typeof episode === "number"
            ? `S${String(season).padStart(2, "0")} • E${String(episode).padStart(2, "0")}`
            : undefined;

        return {
          id: `episode-${slug}-${season ?? "x"}-${episode ?? "y"}-${watchedAt ?? "unknown"}`,
          title: item.show.title ?? item.episode.title ?? "Untitled episode",
          subtitle: [code, item.episode.title].filter(Boolean).join(" • ") || undefined,
          posterUrl: await resolvePoster("show", item.show.images, item.show.ids?.tmdb),
          href:
            typeof season === "number" && typeof episode === "number"
              ? `https://trakt.tv/shows/${slug}/seasons/${season}/episodes/${episode}`
              : `https://trakt.tv/shows/${slug}`,
          meta
        } satisfies WatchCardItem;
      }

      if (type === "show" && item.show) {
        const slug = clampSlug(
          "show",
          item.show.ids?.slug,
          String(item.show.ids?.trakt ?? item.show.ids?.tmdb)
        );

        return {
          id: `show-${slug}-${watchedAt ?? "unknown"}`,
          title: item.show.title ?? "Untitled show",
          subtitle: item.show.year ? String(item.show.year) : undefined,
          posterUrl: await resolvePoster("show", item.show.images, item.show.ids?.tmdb),
          href: `https://trakt.tv/shows/${slug}`,
          meta
        } satisfies WatchCardItem;
      }

      return {
        id: `unknown-${Math.random().toString(36).slice(2, 10)}`,
        title: "Untitled",
        posterUrl: FALLBACK_POSTER,
        href: "#",
        meta
      } satisfies WatchCardItem;
    })
  );
}

export async function getMostWatchedPast30Days(limit = 12, cookieHeader?: string | null) {
  const accessToken = await getTraktAccessToken(parseCookie(cookieHeader));
  if (!accessToken) return [] satisfies WatchCardItem[];

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const aggregates = new Map<string, AggregateEntry>();

  for (let page = 1; page <= 10; page++) {
    const url =
      "https://api.trakt.tv/sync/history" +
      `?type=all&page=${page}&limit=100&extended=full,images&start_at=${encodeURIComponent(
        since.toISOString()
      )}`;

    const response = await fetch(url, { headers: traktHeaders(accessToken) });
    if (!response.ok) break;

    const data = (await response.json()) as any[];
    if (!data.length) break;

    for (const item of data) {
      const watchedAt = new Date(item?.watched_at ?? 0);
      if (!Number.isFinite(watchedAt.valueOf()) || watchedAt < since) continue;

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
    top.map(async item => ({
      id: `${item.id}-30d`,
      title: item.title,
      posterUrl: await resolvePoster(item.type, item.images, item.tmdbId),
      href:
        item.type === "movie"
          ? `https://trakt.tv/movies/${item.slug}`
          : `https://trakt.tv/shows/${item.slug}`,
      meta: `${formatMinutes(item.minutes)} watched • ${item.plays} ${
        item.plays === 1 ? "play" : "plays"
      }`
    }))
  );
}

export async function getMostWatchedAllTime(limit = 12, cookieHeader?: string | null) {
  const accessToken = await getTraktAccessToken(parseCookie(cookieHeader));
  if (!accessToken) return [] satisfies WatchCardItem[];

  const [showsRes, moviesRes] = await Promise.all([
    fetch("https://api.trakt.tv/users/me/watched/shows?extended=full,images", {
      headers: traktHeaders(accessToken)
    }),
    fetch("https://api.trakt.tv/users/me/watched/movies?extended=full,images", {
      headers: traktHeaders(accessToken)
    })
  ]);

  const combined: AggregateEntry[] = [];

  if (showsRes.ok) {
    const shows = (await showsRes.json()) as any[];
    for (const entry of shows ?? []) {
      if (!entry?.show) continue;
      const slug = clampSlug(
        "show",
        entry.show.ids?.slug,
        String(entry.show.ids?.trakt ?? entry.show.ids?.tmdb)
      );
      const plays = Number(entry.plays) || 0;
      const runtime = Number(entry.show.runtime) || 0;

      combined.push({
        id: `show-${slug}`,
        slug,
        type: "show",
        title: entry.show.title ?? "Untitled show",
        minutes: plays * runtime,
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
      const slug = clampSlug(
        "movie",
        entry.movie.ids?.slug,
        String(entry.movie.ids?.trakt ?? entry.movie.ids?.tmdb)
      );
      const plays = Number(entry.plays) || 0;
      const runtime = Number(entry.movie.runtime) || 0;

      combined.push({
        id: `movie-${slug}`,
        slug,
        type: "movie",
        title: entry.movie.title ?? "Untitled movie",
        minutes: plays * runtime,
        plays,
        images: entry.movie.images,
        tmdbId: entry.movie.ids?.tmdb
      });
    }
  }

  return Promise.all(
    combined
      .filter(item => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, limit)
      .map(async item => ({
        id: `${item.id}-all-time`,
        title: item.title,
        posterUrl: await resolvePoster(item.type, item.images, item.tmdbId),
        href:
          item.type === "movie"
            ? `https://trakt.tv/movies/${item.slug}`
            : `https://trakt.tv/shows/${item.slug}`,
        meta: `${formatMinutes(item.minutes)} watched • ${item.plays} ${
          item.plays === 1 ? "play" : "plays"
        }`
      }))
  );
}

export async function getWatchDaysLastYear(cookieHeader?: string | null) {
  const accessToken = await getTraktAccessToken(parseCookie(cookieHeader));
  if (!accessToken) return [] satisfies WatchDay[];

  const map: Record<string, WatchDay> = {};
  const since = new Date(Date.now() - 364 * 24 * 60 * 60 * 1000);
  const sinceIso = `${since.toISOString().split("T")[0]}T00:00:00Z`;

  outer: for (let page = 1; page <= 12; page++) {
    const url =
      "https://api.trakt.tv/sync/history" +
      `?type=all&page=${page}&limit=100&extended=full&start_at=${encodeURIComponent(sinceIso)}`;

    const response = await fetch(url, { headers: traktHeaders(accessToken) });
    if (!response.ok) break;

    const data = (await response.json()) as any[];
    if (!data.length) break;

    for (const item of data) {
      const watchedAt = new Date(item.watched_at);
      if (watchedAt < since) break outer;

      const day = watchedAt.toISOString().slice(0, 10);
      const minutes = item.type === "movie" ? item.movie?.runtime : item.episode?.runtime;
      const seconds = (minutes || 0) * 60;
      const key = item.type === "movie" ? "Movie" : "Episode";

      if (!map[day]) map[day] = { date: day, total: 0, categories: [] };
      map[day].total += seconds;

      const category = map[day].categories.find(entry => entry.name === key);
      if (category) {
        category.total += seconds;
      } else {
        map[day].categories.push({ name: key, total: seconds });
      }
    }
  }

  const days: WatchDay[] = [];
  const cursor = new Date(since);
  const end = new Date();

  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    days.push(map[date] ?? { date, total: 0, categories: [] });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}
