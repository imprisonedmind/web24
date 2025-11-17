"use server";

import "server-only";

import { cookies } from "next/headers";

import { getTraktAccessToken } from "@/lib/traktAuth";

const TRAKT_ID = process.env.TRAKT_CLIENT_ID!;
const TMDB_KEY = process.env.TMDB_KEY;
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

async function resolvePoster(
  data: WatchingResponse
): Promise<string> {
  const imageSource =
    data.movie?.images ??
    data.show?.images ??
    data.episode?.images ??
    null;

  const poster =
    imageSource?.poster?.full ??
    imageSource?.poster?.medium ??
    imageSource?.poster?.thumb ??
    imageSource?.thumb?.full ??
    imageSource?.thumb?.medium ??
    imageSource?.thumb?.thumb ??
    null;

  if (typeof poster === "string" && poster.length) return poster;

  const tmdbId =
    data.movie?.ids?.tmdb ??
    data.show?.ids?.tmdb ??
    null;

  if (!tmdbId || !TMDB_KEY) return FALLBACK_POSTER;

  const entity = data.type === "movie" ? "movie" : "tv";
  const res = await fetch(
    `https://api.themoviedb.org/3/${entity}/${tmdbId}?api_key=${TMDB_KEY}&language=en-US`,
    { next: { revalidate: 86_400 } }
  );
  if (!res.ok) return FALLBACK_POSTER;

  const payload = await res.json();
  const path = payload?.poster_path;
  if (typeof path === "string" && path.length) {
    return `https://image.tmdb.org/t/p/w780${path}`;
  }

  return FALLBACK_POSTER;
}

function buildUrl(data: WatchingResponse): string {
  const base = "https://trakt.tv";

  if (data.type === "movie" && data.movie?.ids?.slug) {
    return `${base}/movies/${data.movie.ids.slug}`;
  }

  if (data.type === "episode" && data.show?.ids?.slug) {
    const season = data.episode?.season;
    const episode = data.episode?.number;
    if (typeof season === "number" && typeof episode === "number") {
      return `${base}/shows/${data.show.ids.slug}/seasons/${season}/episodes/${episode}`;
    }
    return `${base}/shows/${data.show.ids.slug}`;
  }

  if (data.type === "show" && data.show?.ids?.slug) {
    return `${base}/shows/${data.show.ids.slug}`;
  }

  return base;
}

export async function getCurrentlyWatching(): Promise<CurrentlyWatching | null> {
  const tokenFromCookie = cookies().get("trakt_access_token")?.value;
  const token = tokenFromCookie ?? (await getTraktAccessToken());
  if (!token) return null;

  const res = await fetch(
    "https://api.trakt.tv/users/me/watching?extended=full,images",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "trakt-api-key": TRAKT_ID,
        "trakt-api-version": "2"
      },
      cache: "no-store"
    }
  );

  if (res.status === 204) return null;
  if (!res.ok) return null;

  const data = (await res.json()) as WatchingResponse | null;
  if (!data) return null;

  const now = Date.now();
  const expiresAtRaw = data.expires_at;
  const startedAtRaw = data.started_at;

  if (expiresAtRaw) {
    const expiresMs = new Date(expiresAtRaw).getTime();
    if (Number.isFinite(expiresMs) && expiresMs + 60_000 < now) {
      return null;
    }
  } else if (startedAtRaw) {
    const startMs = new Date(startedAtRaw).getTime();
    if (Number.isFinite(startMs) && startMs + 6 * 60 * 60_000 < now) {
      return null;
    }
  }

  const type =
    data.type ??
    (data.episode ? "episode" : data.movie ? "movie" : data.show ? "show" : "movie");

  const posterUrl = await resolvePoster({ ...data, type });

  const showTitle = data.show?.title ?? undefined;
  const episodeTitle = data.episode?.title ?? undefined;
  const season =
    typeof data.episode?.season === "number" ? data.episode?.season : undefined;
  const episode =
    typeof data.episode?.number === "number" ? data.episode?.number : undefined;

  let title =
    (type === "episode"
      ? showTitle ?? episodeTitle
      : data.movie?.title) ?? data.show?.title ?? episodeTitle ?? "Unknown title";

  if (typeof title !== "string" || !title.length) {
    title = "Unknown title";
  }

  const progress =
    typeof data.progress === "number" ? data.progress : undefined;

  const startedAt =
    typeof startedAtRaw === "string" && startedAtRaw.length
      ? startedAtRaw
      : undefined;

  const expiresAt =
    typeof expiresAtRaw === "string" && expiresAtRaw.length
      ? expiresAtRaw
      : undefined;

  return {
    type,
    title,
    showTitle,
    episodeTitle,
    season,
    episode,
    posterUrl,
    url: buildUrl({ ...data, type }),
    progress,
    startedAt,
    expiresAt
  };
}
