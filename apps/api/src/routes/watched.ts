import { Hono } from "hono";

import { AsyncCache } from "../lib/cache";
import {
  getMostWatchedAllTime,
  getMostWatchedForMonth,
  getMostWatchedPast30Days,
  getRecentlyWatched,
  getWatchDaysLastYear,
} from "../services/watched";

const watchedRoutes = new Hono();
const WATCHED_TTL_MS = 60 * 60 * 1000;
const WATCHED_STALE_MS = 6 * 60 * 60 * 1000;
const watchedItemsCache = new AsyncCache<{ items: Awaited<ReturnType<typeof getRecentlyWatched>> }>();
const watchedDaysCache = new AsyncCache<{ days: Awaited<ReturnType<typeof getWatchDaysLastYear>> }>();

watchedRoutes.get("/recent", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "12");
    const payload = await watchedItemsCache.getOrRefresh({
      key: `watched:recent:${limit}`,
      ttlMs: WATCHED_TTL_MS,
      staleWhileRevalidateMs: WATCHED_STALE_MS,
      loader: async () => ({
        items: await getRecentlyWatched(limit),
      }),
    });

    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/watched/recent] failed", error);
    return c.json({ items: [] }, 500);
  }
});

watchedRoutes.get("/month", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "12");
    const payload = await watchedItemsCache.getOrRefresh({
      key: `watched:month:${limit}`,
      ttlMs: WATCHED_TTL_MS,
      staleWhileRevalidateMs: WATCHED_STALE_MS,
      loader: async () => ({
        items: await getMostWatchedPast30Days(limit),
      }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/watched/month] failed", error);
    return c.json({ items: [] }, 500);
  }
});

watchedRoutes.get("/all-time", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "12");
    const payload = await watchedItemsCache.getOrRefresh({
      key: `watched:all-time:${limit}`,
      ttlMs: WATCHED_TTL_MS,
      staleWhileRevalidateMs: WATCHED_STALE_MS,
      loader: async () => ({
        items: await getMostWatchedAllTime(limit),
      }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/watched/all-time] failed", error);
    return c.json({ items: [] }, 500);
  }
});

watchedRoutes.get("/monthly", async c => {
  try {
    const monthIso = c.req.query("monthIso");
    if (!monthIso) return c.json({ items: [] }, 400);

    const limit = Number(c.req.query("limit") ?? "12");
    const payload = await watchedItemsCache.getOrRefresh({
      key: `watched:monthly:${monthIso}:${limit}`,
      ttlMs: WATCHED_TTL_MS,
      staleWhileRevalidateMs: WATCHED_STALE_MS,
      loader: async () => ({
        items: await getMostWatchedForMonth(monthIso, limit),
      }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/watched/monthly] failed", error);
    return c.json({ items: [] }, 500);
  }
});

watchedRoutes.get("/days-last-year", async c => {
  try {
    const payload = await watchedDaysCache.getOrRefresh({
      key: "watched:days-last-year",
      ttlMs: WATCHED_TTL_MS,
      staleWhileRevalidateMs: WATCHED_STALE_MS,
      loader: async () => ({
        days: await getWatchDaysLastYear(),
      }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/watched/days-last-year] failed", error);
    return c.json({ days: [] }, 500);
  }
});

export { watchedRoutes };
