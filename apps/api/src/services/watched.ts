import { listSyncedHistoryEntries, type SyncedHistoryEntry } from "../lib/convex";

const FALLBACK_POSTER = "/fallback-poster.jpg";

export type WatchCardItem = {
  id: string;
  title: string;
  subtitle?: string;
  posterUrl: string;
  href: string;
  meta?: string;
};

type WatchDay = {
  date: string;
  total: number;
  categories: { name: string; total: number }[];
};

type AggregateEntry = {
  id: string;
  type: "show" | "movie";
  title: string;
  minutes: number;
  plays: number;
  posterUrl: string;
  href: string;
};

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
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  }).format(date);
}

function toRecentCard(entry: SyncedHistoryEntry): WatchCardItem {
  return {
    id: entry.historyId,
    title: entry.title,
    subtitle: entry.subtitle,
    posterUrl: entry.posterUrl || FALLBACK_POSTER,
    href: entry.href,
    meta: formatWatchedAt(entry.watchedAt),
  };
}

function aggregateEntries(entries: SyncedHistoryEntry[]) {
  const aggregates = new Map<string, AggregateEntry>();

  for (const entry of entries) {
    const aggregate =
      aggregates.get(entry.aggregateKey) ??
      {
        id: entry.aggregateKey,
        type: entry.aggregateType,
        title: entry.aggregateTitle,
        minutes: 0,
        plays: 0,
        posterUrl: entry.aggregatePosterUrl || FALLBACK_POSTER,
        href: entry.aggregateHref,
      };

    aggregate.minutes += entry.aggregateRuntimeMinutes || entry.runtimeMinutes || 0;
    aggregate.plays += 1;
    aggregates.set(entry.aggregateKey, aggregate);
  }

  return Array.from(aggregates.values());
}

function toAggregateCard(item: AggregateEntry, suffix: string): WatchCardItem {
  return {
    id: `${item.id}-${suffix}`,
    title: item.title,
    posterUrl: item.posterUrl || FALLBACK_POSTER,
    href: item.href,
    meta: `${formatMinutes(item.minutes)} watched • ${item.plays} ${
      item.plays === 1 ? "play" : "plays"
    }`,
  };
}

export async function getRecentlyWatched(limit = 12, _cookieHeader?: string | null) {
  const entries = await listSyncedHistoryEntries({ limit, order: "desc" });
  return entries.slice(0, limit).map(toRecentCard);
}

export async function getMostWatchedPast30Days(limit = 12, _cookieHeader?: string | null) {
  const sinceMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const entries = await listSyncedHistoryEntries({ startMs: sinceMs, order: "desc" });

  return aggregateEntries(entries)
    .filter((item) => item.minutes > 0)
    .sort((left, right) => right.minutes - left.minutes)
    .slice(0, limit)
    .map((item) => toAggregateCard(item, "30d"));
}

export async function getMostWatchedAllTime(limit = 12, _cookieHeader?: string | null) {
  const entries = await listSyncedHistoryEntries({ order: "desc" });

  return aggregateEntries(entries)
    .filter((item) => item.minutes > 0)
    .sort((left, right) => right.minutes - left.minutes)
    .slice(0, limit)
    .map((item) => toAggregateCard(item, "all-time"));
}

export async function getMostWatchedForMonth(
  monthIso: string,
  limit = 12,
  _cookieHeader?: string | null,
) {
  const monthDate = new Date(monthIso);
  if (!Number.isFinite(monthDate.valueOf())) return [] satisfies WatchCardItem[];

  const rangeStart = new Date(
    Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1, 0, 0, 0),
  ).getTime();
  const rangeEnd = new Date(
    Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1, 0, 0, 0),
  ).getTime();
  const monthKey = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`;

  const entries = await listSyncedHistoryEntries({
    startMs: rangeStart,
    endMs: rangeEnd,
    order: "desc",
  });

  return aggregateEntries(entries)
    .filter((item) => item.minutes > 0)
    .sort((left, right) => right.minutes - left.minutes)
    .slice(0, limit)
    .map((item) => toAggregateCard(item, monthKey));
}

export async function getWatchDaysLastYear(_cookieHeader?: string | null) {
  const sinceMs = Date.now() - 364 * 24 * 60 * 60 * 1000;
  const entries = await listSyncedHistoryEntries({ startMs: sinceMs, order: "asc" });
  const map: Record<string, WatchDay> = {};

  for (const entry of entries) {
    const day = new Date(entry.watchedAtMs).toISOString().slice(0, 10);
    const seconds = (entry.runtimeMinutes || 0) * 60;
    const key = entry.entryType === "movie" ? "Movie" : "Episode";

    if (!map[day]) {
      map[day] = { date: day, total: 0, categories: [] };
    }

    map[day].total += seconds;
    const category = map[day].categories.find((item) => item.name === key);
    if (category) {
      category.total += seconds;
    } else {
      map[day].categories.push({ name: key, total: seconds });
    }
  }

  const days: WatchDay[] = [];
  const cursor = new Date(sinceMs);
  const end = new Date();

  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    days.push(map[date] ?? { date, total: 0, categories: [] });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}
