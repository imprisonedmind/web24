import { Hono } from "hono";
import { AsyncCache } from "../lib/cache";
import { getSyncedGamingStatus, getSyncedGamingVersion } from "../lib/convex";
import {
  getMostPlayedGamesAllTime,
  getMostPlayedGamesPast30Days,
  getRecentlyPlayedGames,
} from "../services/gaming";

const gamingRoutes = new Hono();
const GAMING_TTL_MS = 60 * 60 * 1000;
const GAMING_STALE_MS = 6 * 60 * 60 * 1000;
const gamingItemsCache = new AsyncCache<{ items: Awaited<ReturnType<typeof getRecentlyPlayedGames>> }>();

gamingRoutes.get("/status", async c => {
  try {
    const status = await getSyncedGamingStatus();
    const currentGame = status.currentGame && Date.now() - status.currentGame.heartbeatAtMs <= 2 * 60_000
      ? status.currentGame
      : null;
    return c.json({ ...status, currentGame }, 200);
  } catch (error) {
    console.error("[api/gaming/status] failed", error);
    return c.json({ currentGame: null, lastSession: null }, 500);
  }
});

gamingRoutes.get("/recent", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "12");
    const version = await getSyncedGamingVersion();
    const payload = await gamingItemsCache.getOrRefresh({
      key: `gaming:recent:${limit}:${version}`,
      ttlMs: GAMING_TTL_MS,
      staleWhileRevalidateMs: GAMING_STALE_MS,
      loader: async () => ({ items: await getRecentlyPlayedGames(limit, version) }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/gaming/recent] failed", error);
    return c.json({ items: [] }, 500);
  }
});

gamingRoutes.get("/month", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "12");
    const version = await getSyncedGamingVersion();
    const payload = await gamingItemsCache.getOrRefresh({
      key: `gaming:month:${limit}:${version}`,
      ttlMs: GAMING_TTL_MS,
      staleWhileRevalidateMs: GAMING_STALE_MS,
      loader: async () => ({ items: await getMostPlayedGamesPast30Days(limit, version) }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/gaming/month] failed", error);
    return c.json({ items: [] }, 500);
  }
});

gamingRoutes.get("/all-time", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "12");
    const version = await getSyncedGamingVersion();
    const payload = await gamingItemsCache.getOrRefresh({
      key: `gaming:all-time:${limit}:${version}`,
      ttlMs: GAMING_TTL_MS,
      staleWhileRevalidateMs: GAMING_STALE_MS,
      loader: async () => ({ items: await getMostPlayedGamesAllTime(limit, version) }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/gaming/all-time] failed", error);
    return c.json({ items: [] }, 500);
  }
});

export { gamingRoutes };
