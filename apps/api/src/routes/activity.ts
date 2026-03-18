import { Hono } from "hono";

import { AsyncCache } from "../lib/cache";
import { getFullActivityDays, getHomeActivityDays } from "../services/activity";

const activityRoutes = new Hono();
const ACTIVITY_TTL_MS = 60 * 60 * 1000;
const ACTIVITY_STALE_MS = 6 * 60 * 60 * 1000;
const activityHomeCache = new AsyncCache<{ days: Awaited<ReturnType<typeof getHomeActivityDays>> }>();
const activityFullCache = new AsyncCache<Awaited<ReturnType<typeof getFullActivityDays>>>();

activityRoutes.get("/home", async c => {
  try {
    const payload = await activityHomeCache.getOrRefresh({
      key: "activity:home",
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

activityRoutes.get("/full", async c => {
  try {
    const payload = await activityFullCache.getOrRefresh({
      key: "activity:full",
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

export { activityRoutes };
