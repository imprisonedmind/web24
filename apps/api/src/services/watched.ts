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
