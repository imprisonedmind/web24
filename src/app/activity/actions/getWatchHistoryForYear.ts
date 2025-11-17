"use server";

import { eachDayOfInterval, formatISO, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getTraktAccessToken } from "@/lib/traktAuth";

const ID = process.env.TRAKT_CLIENT_ID!;
const TZ = "Africa/Johannesburg";

const SINCE = subDays(new Date(), 364);                       // ← 365-day window
const SINCE_ISO = `${SINCE.toISOString().split("T")[0]}T00:00:00Z`; // midnight

async function* historyPagesLastYear() {
  for (let page = 1; ; page++) {
    const token = await getTraktAccessToken();
    if (!token) return;
    const url =
      `https://api.trakt.tv/sync/history` +
      `?type=all&page=${page}&limit=100&extended=full&start_at=${encodeURIComponent(SINCE_ISO)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "trakt-api-key": ID,
        "trakt-api-version": "2"
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) return;

    const arr: any[] = await res.json();
    if (!arr.length) return;                                   // no more pages
    yield arr;
  }
}

export async function getWatchDaysLastYear() {
  const map: Record<
    string,
    {
      date: string;
      total: number;
      categories: { name: string; total: number }[]
    }
  > = {};

  /* -------- build the map -------- */
  outer: for await (const page of historyPagesLastYear()) {
    for (const it of page) {
      const local = toZonedTime(new Date(it.watched_at), TZ);
      if (local < SINCE) break outer;                          // window reached

      const day = local.toISOString().slice(0, 10);            // YYYY-MM-DD
      const minutes = it.type === "movie" ? it.movie?.runtime : it.episode?.runtime;
      const seconds = (minutes || 0) * 60;

      if (!map[day]) map[day] = { date: day, total: 0, categories: [] };

      map[day].total += seconds;

      const key = it.type === "movie" ? "Movie" : "Episode";
      const cat = map[day].categories.find(c => c.name === key);
      cat ? (cat.total += seconds) : map[day].categories.push({
        name: key,
        total: seconds
      });
    }
  }

  /* -------- fill gaps so every day exists -------- */
  const fullSpan = eachDayOfInterval({ start: SINCE, end: new Date() });
  for (const d of fullSpan) {
    const iso = formatISO(d, { representation: "date" });
    if (!map[iso]) map[iso] = { date: iso, total: 0, categories: [] };
  }

  /* -------- ready for <Chunk> -------- */
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}
