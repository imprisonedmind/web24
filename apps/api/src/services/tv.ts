import { getTraktAccessToken } from "../lib/traktAuth";

const FALLBACK_POSTER = "/fallback-poster.jpg";

type TraktIds = {
  slug?: string | null;
  tmdb?: number | null;
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

type WatchingResponse = {
  type?: "movie" | "show" | "episode";
  progress?: number | null;
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
    ids?: TraktIds | null;
    images?: TraktImages;
  } | null;
};

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

  const entity = type === "movie" ? "movie" : "tv";
  const response = await fetch(
    `https://api.themoviedb.org/3/${entity}/${tmdbId}?api_key=${key}&language=en-US`
  );

  if (!response.ok) return FALLBACK_POSTER;

  const payload = (await response.json()) as { poster_path?: string | null };
  const posterPath = payload?.poster_path;
  return typeof posterPath === "string" && posterPath.length
    ? `https://image.tmdb.org/t/p/w780${posterPath}`
    : FALLBACK_POSTER;
}

async function resolveWatchingPoster(data: WatchingResponse) {
  const imageSource = data.movie?.images ?? data.show?.images ?? data.episode?.images ?? null;
  const poster =
    imageSource?.poster?.full ??
    imageSource?.poster?.medium ??
    imageSource?.poster?.thumb ??
    imageSource?.thumb?.full ??
    imageSource?.thumb?.medium ??
    imageSource?.thumb?.thumb ??
    null;

  if (typeof poster === "string" && poster.length) return poster;

  const tmdbId = data.movie?.ids?.tmdb ?? data.show?.ids?.tmdb ?? null;
  return fetchTmdbPoster(data.type === "movie" ? "movie" : "show", tmdbId);
}

function buildUrl(data: WatchingResponse) {
  const base = "https://trakt.tv";

  if (data.type === "movie" && data.movie?.ids?.slug) {
    return `${base}/movies/${data.movie.ids.slug}`;
  }

  if (data.type === "episode" && data.show?.ids?.slug) {
    const season = data.episode?.season;
    const episode = data.episode?.number;
    return typeof season === "number" && typeof episode === "number"
      ? `${base}/shows/${data.show.ids.slug}/seasons/${season}/episodes/${episode}`
      : `${base}/shows/${data.show.ids.slug}`;
  }

  if (data.type === "show" && data.show?.ids?.slug) {
    return `${base}/shows/${data.show.ids.slug}`;
  }

  return base;
}

export async function getCurrentlyWatching(cookieHeader?: string | null) {
  const accessToken = await getTraktAccessToken(parseCookie(cookieHeader));
  if (!accessToken) return null;

  const response = await fetch("https://api.trakt.tv/users/me/watching?extended=full,images", {
    headers: traktHeaders(accessToken)
  });

  if (response.status === 204 || !response.ok) return null;

  const data = (await response.json()) as WatchingResponse | null;
  if (!data) return null;

  const now = Date.now();
  const expiresAtRaw = data.expires_at;
  const startedAtRaw = data.started_at;

  if (expiresAtRaw) {
    const expiresMs = new Date(expiresAtRaw).getTime();
    if (Number.isFinite(expiresMs) && expiresMs + 60_000 < now) return null;
  } else if (startedAtRaw) {
    const startMs = new Date(startedAtRaw).getTime();
    if (Number.isFinite(startMs) && startMs + 6 * 60 * 60_000 < now) return null;
  }

  const type =
    data.type ??
    (data.episode ? "episode" : data.movie ? "movie" : data.show ? "show" : "movie");

  const normalized = { ...data, type };
  const showTitle = normalized.show?.title ?? undefined;
  const episodeTitle = normalized.episode?.title ?? undefined;
  const season =
    typeof normalized.episode?.season === "number" ? normalized.episode.season : undefined;
  const episode =
    typeof normalized.episode?.number === "number" ? normalized.episode.number : undefined;

  return {
    type,
    title:
      (type === "episode" ? showTitle ?? episodeTitle : normalized.movie?.title) ??
      normalized.show?.title ??
      episodeTitle ??
      "Unknown title",
    showTitle,
    episodeTitle,
    season,
    episode,
    posterUrl: await resolveWatchingPoster(normalized),
    url: buildUrl(normalized),
    progress: typeof normalized.progress === "number" ? normalized.progress : undefined,
    startedAt:
      typeof startedAtRaw === "string" && startedAtRaw.length ? startedAtRaw : undefined,
    expiresAt:
      typeof expiresAtRaw === "string" && expiresAtRaw.length ? expiresAtRaw : undefined
  } satisfies CurrentlyWatching;
}

export async function getLastWatched(cookieHeader?: string | null) {
  const accessToken = await getTraktAccessToken(parseCookie(cookieHeader));
  if (!accessToken) return null;

  const response = await fetch(
    "https://api.trakt.tv/sync/history?limit=1&page=1&extended=images",
    { headers: traktHeaders(accessToken) }
  );

  if (!response.ok) return null;
  const [item] = (await response.json()) as any[];
  if (!item) return null;

  const type: "movie" | "show" | "episode" =
    item.type ?? (item.episode ? "episode" : item.movie ? "movie" : "show");

  const showTitle = item.show?.title;
  const episodeTitle = item.episode?.title;
  const season = typeof item.episode?.season === "number" ? item.episode.season : undefined;
  const episode = typeof item.episode?.number === "number" ? item.episode.number : undefined;
  const images = item.movie?.images ?? item.show?.images ?? item.episode?.images;

  let posterUrl = images?.poster?.full ?? FALLBACK_POSTER;
  if (posterUrl === FALLBACK_POSTER) {
    const tmdbId = item.movie?.ids?.tmdb ?? item.show?.ids?.tmdb;
    posterUrl = await fetchTmdbPoster(type === "movie" ? "movie" : "show", tmdbId);
  }

  const url =
    type === "movie"
      ? `https://trakt.tv/movies/${item.movie?.ids?.slug ?? ""}`
      : type === "episode"
        ? `https://trakt.tv/shows/${item.show?.ids?.slug ?? ""}/seasons/${season}/episodes/${episode}`
        : `https://trakt.tv/shows/${item.show?.ids?.slug ?? ""}`;

  return {
    type,
    title:
      (type === "episode" ? showTitle ?? episodeTitle : item.movie?.title) ??
      item.show?.title ??
      item.episode?.title ??
      "Unknown title",
    showTitle: showTitle ?? undefined,
    episodeTitle: episodeTitle ?? undefined,
    season,
    episode,
    watchedAt: item.watched_at,
    posterUrl,
    url
  } satisfies LastWatched;
}
