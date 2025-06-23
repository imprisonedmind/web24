const ID = process.env.TRAKT_CLIENT_ID!;
const TOKEN = process.env.TRAKT_ACCESS_TOKEN!;

async function* historyPages() {
  for (let page = 1; ; page++) {
    const res = await fetch(
      `https://api.trakt.tv/sync/history?type=all&page=${page}&limit=100&extended=full`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "trakt-api-key": ID,
          "trakt-api-version": "2"
        },
        cache: "no-store"
      }
    );
    if (!res.ok) throw new Error(`Trakt ${res.status}`);
    const arr = await res.json();            // 0-length = no more pages  [oai_citation:3‡forums.trakt.tv](https://forums.trakt.tv/t/date-recorded-with-watching-now/19369?utm_source=chatgpt.com)
    if (!arr.length) return;
    yield arr;
  }
}


import { eachDayOfInterval, formatISO, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function getWatchDays() {
  const dayMap: Record<
    string,
    {
      date: string;
      total: number;
      categories: { name: string; total: number }[]
    }
  > = {};

  /* ------------ 1.  build map exactly as you already do ------------ */
  for await (const page of historyPages()) {
    for (const item of page) {
      const local = toZonedTime(new Date(item.watched_at), "Africa/Johannesburg");
      const day = local.toISOString().slice(0, 10);          // YYYY-MM-DD

      const minutes = item.type === "movie"
        ? item.movie?.runtime
        : item.episode?.runtime;

      const seconds = (minutes || 0) * 60;

      if (!dayMap[day]) dayMap[day] = { date: day, total: 0, categories: [] };

      const bucket = dayMap[day];
      bucket.total += seconds;

      const key = item.type === "movie" ? "Movie" : "Episode";
      const cat = bucket.categories.find(c => c.name === key);
      cat ? (cat.total += seconds) : bucket.categories.push({
        name: key,
        total: seconds
      });
    }
  }

  /* ------------ 2.  fill in gaps so every date exists ------------ */
  if (!Object.keys(dayMap).length) return [];                // nothing watched

  const minDay = parseISO(Object.keys(dayMap).sort()[0]);    // first watch
  const maxDay = toZonedTime(new Date(), "Africa/Johannesburg"); // today

  for (const d of eachDayOfInterval({ start: minDay, end: maxDay })) {
    const date = formatISO(d, { representation: "date" });   // YYYY-MM-DD
    if (!dayMap[date]) dayMap[date] = { date, total: 0, categories: [] };
  }

  /* ------------ 3.  return WakaTime-compatible array ------------ */
  return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
}