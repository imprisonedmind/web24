import {
  listSyncedGamingAggregates,
  listSyncedGamingSessions,
  type SyncedGamingAggregate,
  type SyncedGamingSession,
} from "../lib/convex";

export type GamingCardItem = {
  id: string;
  title: string;
  coverUrl?: string;
  href?: string;
  meta?: string;
};

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) return `${hours}h ${remainingMinutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function formatDistanceLabel(valueMs: number) {
  const diffMs = Math.max(0, Date.now() - valueMs);
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function toRecentCard(session: SyncedGamingSession): GamingCardItem {
  return {
    id: session.externalId,
    title: session.title,
    coverUrl: session.coverUrl,
    meta: formatDistanceLabel(session.endedAtMs),
  };
}

function toAggregateCard(item: SyncedGamingAggregate, suffix: string): GamingCardItem {
  return {
    id: `${item.gameId}-${suffix}`,
    title: item.title,
    coverUrl: item.coverUrl,
    meta: `${formatDuration(item.durationSeconds)} played • ${item.sessions} ${
      item.sessions === 1 ? "session" : "sessions"
    }`,
  };
}

export async function getRecentlyPlayedGames(limit = 12, cacheVersion?: string) {
  const sessions = await listSyncedGamingSessions({ limit, cacheVersion });
  return sessions.map(toRecentCard);
}

export async function getMostPlayedGamesPast30Days(limit = 12, cacheVersion?: string) {
  const sinceMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const items = await listSyncedGamingAggregates({ startMs: sinceMs, limit, cacheVersion });
  return items.map(item => toAggregateCard(item, "30d"));
}

export async function getMostPlayedGamesAllTime(limit = 12, cacheVersion?: string) {
  const items = await listSyncedGamingAggregates({ limit, cacheVersion });
  return items.map(item => toAggregateCard(item, "all-time"));
}
