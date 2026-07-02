import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const currentGame = v.object({
  gameId: v.string(), title: v.string(), executable: v.string(), platform: v.string(),
  startedAtMs: v.number(), heartbeatAtMs: v.number(),
  coverUrl: v.optional(v.string()),
});

function metadataKey(title: string) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeIgdbSearch(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export const ingest = mutation({
  args: {
    sessions: v.array(v.object({
      externalId: v.string(), gameId: v.string(), title: v.string(), executable: v.string(),
      platform: v.string(), startedAtMs: v.number(), endedAtMs: v.number(),
      durationSeconds: v.number(), source: v.string(), updatedAtMs: v.number(),
      coverUrl: v.optional(v.string()),
    })),
    currentGame: v.optional(v.union(currentGame, v.null())),
    clearCurrent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    for (const session of args.sessions) {
      const { coverUrl: _legacyCoverUrl, ...cleanSession } = session;
      const existing = await ctx.db.query("gamingSessions").withIndex("by_externalId", q => q.eq("externalId", session.externalId)).unique();
      if (existing) await ctx.db.replace(existing._id, cleanSession); else await ctx.db.insert("gamingSessions", cleanSession);
    }
    const games = [
      ...args.sessions.map(session => ({ title: session.title, platform: session.platform })),
      ...(args.currentGame ? [{ title: args.currentGame.title, platform: args.currentGame.platform }] : []),
    ];
    for (const game of new Map(games.map(item => [metadataKey(item.title), item])).values()) {
      const key = metadataKey(game.title);
      const metadata = await ctx.db.query("gamingMetadata").withIndex("by_key", q => q.eq("key", key)).unique();
      const retryFailed = metadata?.status === "failed" && Date.now() - metadata.updatedAtMs > 3_600_000;
      if (!metadata || retryFailed) {
        if (metadata) await ctx.db.patch(metadata._id, { status: "pending", updatedAtMs: Date.now() });
        else await ctx.db.insert("gamingMetadata", { key, ...game, status: "pending", updatedAtMs: Date.now() });
        await ctx.scheduler.runAfter(0, internal.gaming.resolveMetadata, { key, ...game });
      }
    }
    const state = await ctx.db.query("gamingSyncState").withIndex("by_key", q => q.eq("key", "windows-tracker")).unique();
    const cleanCurrentGame = args.currentGame
      ? (({ coverUrl: _legacyCoverUrl, ...game }) => game)(args.currentGame)
      : args.currentGame;
    const value = { key: "windows-tracker", currentGame: args.clearCurrent ? undefined : (cleanCurrentGame ?? state?.currentGame), updatedAtMs: Date.now() };
    if (state) await ctx.db.patch(state._id, value); else await ctx.db.insert("gamingSyncState", value);
    return { sessions: args.sessions.length };
  },
});

function addSessionToDays(
  days: Map<string, Map<string, { title: string; total: number }>>,
  title: string,
  startedAtMs: number,
  endedAtMs: number,
) {
  let cursor = startedAtMs;
  while (cursor < endedAtMs) {
    const date = new Date(cursor).toISOString().slice(0, 10);
    const nextDayMs = Date.parse(`${date}T00:00:00.000Z`) + 86_400_000;
    const seconds = Math.max(1, Math.round((Math.min(endedAtMs, nextDayMs) - cursor) / 1000));
    const games = days.get(date) ?? new Map();
    const existing = games.get(title);
    games.set(title, { title, total: (existing?.total ?? 0) + seconds });
    days.set(date, games);
    cursor = nextDayMs;
  }
}

export const listDailyActivity = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const [sessions, state] = await Promise.all([
      ctx.db.query("gamingSessions").withIndex("by_startedAtMs").collect(),
      ctx.db.query("gamingSyncState").withIndex("by_key", q => q.eq("key", "windows-tracker")).unique(),
    ]);
    const days = new Map<string, Map<string, { title: string; total: number }>>();
    for (const session of sessions) addSessionToDays(days, session.title, session.startedAtMs, session.endedAtMs);
    if (state?.currentGame) addSessionToDays(days, state.currentGame.title, state.currentGame.startedAtMs, state.currentGame.heartbeatAtMs);
    return [...days.entries()]
      .filter(([date]) => (!args.startDate || date >= args.startDate) && (!args.endDate || date <= args.endDate))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, games]) => ({
        date,
        total: [...games.values()].reduce((sum, game) => sum + game.total, 0),
        categories: [...games.values()].sort((left, right) => right.total - left.total).map(game => ({ name: game.title, total: game.total })),
      }));
  },
});

export const listRecentSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 12;
    const sessions = await ctx.db.query("gamingSessions").withIndex("by_startedAtMs").order("desc").take(limit);
    const metadataByKey = new Map<string, { coverUrl?: string } | null>();

    for (const session of sessions) {
      const key = metadataKey(session.title);
      if (!metadataByKey.has(key)) {
        metadataByKey.set(
          key,
          await ctx.db.query("gamingMetadata").withIndex("by_key", q => q.eq("key", key)).unique(),
        );
      }
    }

    return sessions.map(session => ({
      ...session,
      coverUrl: metadataByKey.get(metadataKey(session.title))?.coverUrl,
    }));
  },
});

export const listMostPlayed = query({
  args: { startMs: v.optional(v.number()), endMs: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 12;
    const sessions = await ctx.db.query("gamingSessions").withIndex("by_startedAtMs").collect();
    const totals = new Map<string, {
      gameId: string;
      title: string;
      platform: string;
      durationSeconds: number;
      sessions: number;
      latestEndedAtMs: number;
    }>();

    for (const session of sessions) {
      const startedAtMs = Math.max(session.startedAtMs, args.startMs ?? session.startedAtMs);
      const endedAtMs = Math.min(session.endedAtMs, args.endMs ?? session.endedAtMs);
      if (endedAtMs <= startedAtMs) continue;
      const durationSeconds = Math.max(1, Math.round((endedAtMs - startedAtMs) / 1000));

      const key = metadataKey(session.title);
      const existing = totals.get(key);
      if (existing) {
        existing.durationSeconds += durationSeconds;
        existing.sessions += 1;
        existing.latestEndedAtMs = Math.max(existing.latestEndedAtMs, session.endedAtMs);
      } else {
        totals.set(key, {
          gameId: session.gameId,
          title: session.title,
          platform: session.platform,
          durationSeconds,
          sessions: 1,
          latestEndedAtMs: session.endedAtMs,
        });
      }
    }

    const items = [...totals.entries()]
      .sort(([, left], [, right]) => right.durationSeconds - left.durationSeconds)
      .slice(0, limit);
    const metadata = await Promise.all(
      items.map(([key]) => ctx.db.query("gamingMetadata").withIndex("by_key", q => q.eq("key", key)).unique()),
    );

    return items.map(([, item], index) => ({
      ...item,
      coverUrl: metadata[index]?.coverUrl,
    }));
  },
});

export const getStatus = query({
  args: {},
  handler: async ctx => {
    const [state, latest] = await Promise.all([
      ctx.db.query("gamingSyncState").withIndex("by_key", q => q.eq("key", "windows-tracker")).unique(),
      ctx.db.query("gamingSessions").withIndex("by_startedAtMs").order("desc").first(),
    ]);
    const currentMetadata = state?.currentGame
      ? await ctx.db.query("gamingMetadata").withIndex("by_key", q => q.eq("key", metadataKey(state.currentGame!.title))).unique()
      : null;
    const latestMetadata = latest
      ? await ctx.db.query("gamingMetadata").withIndex("by_key", q => q.eq("key", metadataKey(latest.title))).unique()
      : null;
    return {
      currentGame: state?.currentGame ? { ...state.currentGame, coverUrl: currentMetadata?.coverUrl } : null,
      lastSession: latest ? { ...latest, coverUrl: latestMetadata?.coverUrl } : null,
    };
  },
});

export const saveMetadata = internalMutation({
  args: {
    key: v.string(), status: v.union(v.literal("resolved"), v.literal("failed")),
    igdbId: v.optional(v.number()), matchedTitle: v.optional(v.string()), coverUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.query("gamingMetadata").withIndex("by_key", q => q.eq("key", args.key)).unique();
    if (row) await ctx.db.patch(row._id, { ...args, updatedAtMs: Date.now() });
  },
});

export const ensureMetadata = internalMutation({
  args: { key: v.string(), title: v.string(), platform: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("gamingMetadata").withIndex("by_key", q => q.eq("key", args.key)).unique();
    if (!existing) await ctx.db.insert("gamingMetadata", { ...args, status: "pending", updatedAtMs: Date.now() });
  },
});

export const resolveMetadata = internalAction({
  args: { key: v.string(), title: v.string(), platform: v.string() },
  handler: async (ctx, args) => {
    try {
      const clientId = process.env.IGDB_CLIENT_ID;
      const clientSecret = process.env.IGDB_CLIENT_SECRET;
      if (!clientId || !clientSecret) throw new Error("Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET");
      const tokenResponse = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`, { method: "POST" });
      if (!tokenResponse.ok) throw new Error(`IGDB authentication failed: ${tokenResponse.status}`);
      const token = await tokenResponse.json() as { access_token: string };
      const gamesResponse = await fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers: { "Client-ID": clientId, Authorization: `Bearer ${token.access_token}`, "Content-Type": "text/plain" },
        body: `search "${escapeIgdbSearch(args.title)}"; fields name,cover.image_id,platforms.name; where version_parent = null; limit 10;`,
      });
      if (!gamesResponse.ok) throw new Error(`IGDB search failed: ${gamesResponse.status}`);
      const games = await gamesResponse.json() as { id: number; name: string; cover?: { image_id?: string }; platforms?: { name: string }[] }[];
      const normalized = args.title.trim().toLowerCase();
      const exact = games.filter(game => game.name.trim().toLowerCase() === normalized);
      const pool = exact.length ? exact : games;
      const match = pool.find(game => game.platforms?.some(platform => platform.name.toLowerCase().includes("pc"))) ?? pool[0];
      const imageId = match?.cover?.image_id;
      await ctx.runMutation(internal.gaming.saveMetadata, match && imageId ? {
        key: args.key, status: "resolved", igdbId: match.id, matchedTitle: match.name,
        coverUrl: `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg`,
      } : { key: args.key, status: "failed" });
      return match && imageId
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg`
        : null;
    } catch (error) {
      console.error(`[gaming] metadata resolution failed for ${args.title}`, error);
      await ctx.runMutation(internal.gaming.saveMetadata, { key: args.key, status: "failed" });
      return null;
    }
  },
});

export const resolveCover = action({
  args: { title: v.string(), platform: v.string() },
  handler: async (ctx, args): Promise<string | null> => {
    const key = metadataKey(args.title);
    await ctx.runMutation(internal.gaming.ensureMetadata, { key, ...args });
    return await ctx.runAction(internal.gaming.resolveMetadata, { key, ...args });
  },
});

export const getSyncVersion = query({
  args: {},
  handler: async ctx => {
    const state = await ctx.db.query("gamingSyncState").withIndex("by_key", q => q.eq("key", "windows-tracker")).unique();
    return state ? `${state.updatedAtMs}:${state.currentGame?.heartbeatAtMs ?? 0}` : "empty";
  },
});
