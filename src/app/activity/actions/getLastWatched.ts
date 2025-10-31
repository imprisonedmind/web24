// app/(actions)/getLastWatched.ts
"use server";

import "server-only";
import { cookies } from "next/headers";
import { getTraktAccessToken } from "@/lib/traktAuth";

type LastWatched = {
  title: string;
  posterUrl: string;
  watchedAt: string;   // ISO 8601
  url: string;         // Trakt deep-link
};

export async function getLastWatched(): Promise<LastWatched | null> {
  const TRAKT_ID = process.env.TRAKT_CLIENT_ID!;
  const cookieToken = cookies().get("trakt_access_token")?.value;
  const ACCESS = cookieToken ?? (await getTraktAccessToken());

  const headers = {
    "trakt-api-version": "2",
    "trakt-api-key": TRAKT_ID,
    Authorization: `Bearer ${ACCESS}`,
  };

  // newest history entry incl. images
  const res = await fetch(
    "https://api.trakt.tv/sync/history?limit=1&page=1&extended=images",
    { headers, next: { revalidate: 600 } }
  );
  if (!res.ok) return null;
  const [item] = (await res.json()) as any[];

  /* ---------- poster lookup (same as before) ---------- */
  const images =
    item?.movie?.images ||
    item?.show?.images ||
    item?.episode?.images;
  let poster = images?.poster?.full;

  const tmdbId = item?.movie?.ids?.tmdb ?? item?.show?.ids?.tmdb;
  if (!poster && tmdbId) {
    const tmdb = await fetch(
      `https://api.themoviedb.org/3/${item.type === "movie" ? "movie" : "tv"}/${tmdbId}?api_key=${process.env.TMDB_KEY}&language=en-US`
    ).then(r => r.json());
    poster =
      tmdb?.poster_path && `https://image.tmdb.org/t/p/w780${tmdb.poster_path}`;
  }

  /* ---------- build the outbound Trakt link ---------- */
  let url = "https://trakt.tv/";
  if (item.type === "movie") {
    url += `movies/${item.movie.ids.slug}`;                 // e.g. /movies/inception-2010
  } else if (item.type === "episode") {
    const s = item.episode.season;                          // season number
    const e = item.episode.number;                          // episode number
    url += `shows/${item.show.ids.slug}/seasons/${s}/episodes/${e}`;  // e.g. /shows/friends/seasons/1/episodes/5
  } else {
    url += `shows/${item.show.ids.slug}`;                   // fall-back
  }

  /* ---------- ship it ---------- */
  return {
    title:
      item.movie?.title ??
      item.episode?.title ??
      item.show?.title ??
      "Unknown title",
    watchedAt: item.watched_at,
    posterUrl: poster ?? "/fallback-poster.jpg",
    url,
  };
}
