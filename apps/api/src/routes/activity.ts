import { Hono } from "hono";

import { AsyncCache } from "../lib/cache";
import { getSyncedHealthVersion, getSyncedHistoryVersion } from "../lib/convex";
import {
  getFullActivityDays,
  getHealthActivitySections,
  getHomeHeroHealthStats,
  getHomeActivityDays,
  getWatchingActivityDays,
  getWorkActivitySections
} from "../services/activity";

const activityRoutes = new Hono();
const ACTIVITY_TTL_MS = 60 * 60 * 1000;
const ACTIVITY_STALE_MS = 6 * 60 * 60 * 1000;
const activityHomeCache = new AsyncCache<{ days: Awaited<ReturnType<typeof getHomeActivityDays>> }>();
const activityHomeHeroCache = new AsyncCache<Awaited<ReturnType<typeof getHomeHeroHealthStats>>>();
const activityFullCache = new AsyncCache<Awaited<ReturnType<typeof getFullActivityDays>>>();
const activityWatchingCache = new AsyncCache<{ watchingDays: Awaited<ReturnType<typeof getWatchingActivityDays>> }>();
const activityWorkCache = new AsyncCache<{ workSections: Awaited<ReturnType<typeof getWorkActivitySections>> }>();
const activityHealthCache = new AsyncCache<{ healthSections: Awaited<ReturnType<typeof getHealthActivitySections>> }>();

activityRoutes.get("/home", async c => {
  try {
    const [historyVersion, healthVersion] = await Promise.all([
      getSyncedHistoryVersion(),
      getSyncedHealthVersion()
    ]);
    const payload = await activityHomeCache.getOrRefresh({
      key: `activity:home:${historyVersion}:${healthVersion}`,
      ttlMs: ACTIVITY_TTL_MS,
      staleWhileRevalidateMs: ACTIVITY_STALE_MS,
      loader: async () => ({
        days: await getHomeActivityDays(),
      }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/activity/home] failed", error);
    return c.json({ days: [] }, 500);
  }
});

activityRoutes.get("/home/hero", async c => {
  try {
    const version = await getSyncedHealthVersion();
    const payload = await activityHomeHeroCache.getOrRefresh({
      key: `activity:home:hero:${version}`,
      ttlMs: ACTIVITY_TTL_MS,
      staleWhileRevalidateMs: ACTIVITY_STALE_MS,
      loader: async () => getHomeHeroHealthStats(),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/activity/home/hero] failed", error);
    return c.json({ heartRateBpm: null, steps: null, date: null }, 500);
  }
});

activityRoutes.get("/full", async c => {
  try {
    const [historyVersion, healthVersion] = await Promise.all([
      getSyncedHistoryVersion(),
      getSyncedHealthVersion()
    ]);
    const payload = await activityFullCache.getOrRefresh({
      key: `activity:full:${historyVersion}:${healthVersion}`,
      ttlMs: ACTIVITY_TTL_MS,
      staleWhileRevalidateMs: ACTIVITY_STALE_MS,
      loader: async () => getFullActivityDays(),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/activity/full] failed", error);
    return c.json({ watchingDays: [], workSections: [] }, 500);
  }
});

activityRoutes.get("/watching", async c => {
  try {
    const version = await getSyncedHistoryVersion();
    const payload = await activityWatchingCache.getOrRefresh({
      key: `activity:watching:${version}`,
      ttlMs: ACTIVITY_TTL_MS,
      staleWhileRevalidateMs: ACTIVITY_STALE_MS,
      loader: async () => ({
        watchingDays: await getWatchingActivityDays(),
      }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/activity/watching] failed", error);
    return c.json({ watchingDays: [] }, 500);
  }
});

activityRoutes.get("/work", async c => {
  try {
    const payload = await activityWorkCache.getOrRefresh({
      key: "activity:work",
      ttlMs: ACTIVITY_TTL_MS,
      staleWhileRevalidateMs: ACTIVITY_STALE_MS,
      loader: async () => ({
        workSections: await getWorkActivitySections(),
      }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/activity/work] failed", error);
    return c.json({ workSections: [] }, 500);
  }
});

activityRoutes.get("/health", async c => {
  try {
    const version = await getSyncedHealthVersion();
    const payload = await activityHealthCache.getOrRefresh({
      key: `activity:health:${version}`,
      ttlMs: ACTIVITY_TTL_MS,
      staleWhileRevalidateMs: ACTIVITY_STALE_MS,
      loader: async () => ({
        healthSections: await getHealthActivitySections(),
      }),
    });
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/activity/health] failed", error);
    return c.json({ healthSections: [] }, 500);
  }
});

export { activityRoutes };
