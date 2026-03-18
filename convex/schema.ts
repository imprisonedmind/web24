import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  traktHistoryEntries: defineTable({
    historyId: v.string(),
    watchedAt: v.string(),
    watchedAtMs: v.number(),
    entryType: v.union(v.literal("movie"), v.literal("show"), v.literal("episode")),
    title: v.string(),
    subtitle: v.optional(v.string()),
    posterUrl: v.string(),
    href: v.string(),
    showTitle: v.optional(v.string()),
    episodeTitle: v.optional(v.string()),
    season: v.optional(v.number()),
    episode: v.optional(v.number()),
    runtimeMinutes: v.number(),
    aggregateKey: v.string(),
    aggregateType: v.union(v.literal("movie"), v.literal("show")),
    aggregateTitle: v.string(),
    aggregateHref: v.string(),
    aggregatePosterUrl: v.string(),
    aggregateRuntimeMinutes: v.number(),
  })
    .index("by_historyId", ["historyId"])
    .index("by_watchedAtMs", ["watchedAtMs"]),
  traktState: defineTable({
    key: v.string(),
    syncedAtMs: v.number(),
    currentWatching: v.optional(
      v.object({
        type: v.union(v.literal("movie"), v.literal("show"), v.literal("episode")),
        title: v.string(),
        showTitle: v.optional(v.string()),
        episodeTitle: v.optional(v.string()),
        season: v.optional(v.number()),
        episode: v.optional(v.number()),
        posterUrl: v.string(),
        url: v.string(),
        progress: v.optional(v.number()),
        startedAt: v.optional(v.string()),
        expiresAt: v.optional(v.string()),
      }),
    ),
  }).index("by_key", ["key"]),
  traktAuthState: defineTable({
    key: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    tokenType: v.optional(v.string()),
    scope: v.optional(v.string()),
    createdAtSeconds: v.optional(v.number()),
    expiresInSeconds: v.optional(v.number()),
    expiresAtMs: v.number(),
    updatedAtMs: v.number(),
  }).index("by_key", ["key"]),
});
