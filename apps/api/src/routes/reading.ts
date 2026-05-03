import { Hono } from "hono";

import { AsyncCache } from "../lib/cache";
import { getSyncedReadingVersion } from "../lib/convex";
import {
  getCurrentReading,
  getCurrentlyReadingBooks,
  getFinishedReadingBooks,
  getRecentReadingSessions,
} from "../services/reading";

const readingRoutes = new Hono();
const readingStatusCache = new AsyncCache<Awaited<ReturnType<typeof getCurrentReading>>>();
const readingItemsCache = new AsyncCache<{
  items: Awaited<ReturnType<typeof getCurrentlyReadingBooks>>;
}>();
const readingOverviewCache = new AsyncCache<{
  currentItems: Awaited<ReturnType<typeof getCurrentlyReadingBooks>>;
  finishedItems: Awaited<ReturnType<typeof getFinishedReadingBooks>>;
  sessionItems: Awaited<ReturnType<typeof getRecentReadingSessions>>;
}>();
const READING_TTL_MS = 60_000;
const READING_STALE_MS = 5 * 60_000;

readingRoutes.get("/status", async c => {
  try {
    const version = await getSyncedReadingVersion();
    const payload = await readingStatusCache.getOrRefresh({
      key: `reading:status:${version}`,
      ttlMs: READING_TTL_MS,
      staleWhileRevalidateMs: READING_STALE_MS,
      loader: async () => getCurrentReading(),
    });

    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/reading/status] failed to fetch status", error);
    return c.json(null, 500);
  }
});

readingRoutes.get("/overview", async c => {
  try {
    const version = await getSyncedReadingVersion();
    const payload = await readingOverviewCache.getOrRefresh({
      key: `reading:overview:${version}`,
      ttlMs: READING_TTL_MS,
      staleWhileRevalidateMs: READING_STALE_MS,
      loader: async () => {
        const [currentItems, finishedItems, sessionItems] = await Promise.all([
          getCurrentlyReadingBooks(12),
          getFinishedReadingBooks(12),
          getRecentReadingSessions(12),
        ]);

        return { currentItems, finishedItems, sessionItems };
      },
    });

    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/reading/overview] failed", error);
    return c.json({ currentItems: [], finishedItems: [], sessionItems: [] }, 500);
  }
});

readingRoutes.get("/current", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "48");
    const version = await getSyncedReadingVersion();
    const payload = await readingItemsCache.getOrRefresh({
      key: `reading:current:${limit}:${version}`,
      ttlMs: READING_TTL_MS,
      staleWhileRevalidateMs: READING_STALE_MS,
      loader: async () => ({ items: await getCurrentlyReadingBooks(limit) }),
    });

    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/reading/current] failed", error);
    return c.json({ items: [] }, 500);
  }
});

readingRoutes.get("/finished", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "48");
    const version = await getSyncedReadingVersion();
    const payload = await readingItemsCache.getOrRefresh({
      key: `reading:finished:${limit}:${version}`,
      ttlMs: READING_TTL_MS,
      staleWhileRevalidateMs: READING_STALE_MS,
      loader: async () => ({ items: await getFinishedReadingBooks(limit) }),
    });

    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/reading/finished] failed", error);
    return c.json({ items: [] }, 500);
  }
});

readingRoutes.get("/sessions", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "48");
    const version = await getSyncedReadingVersion();
    const payload = await readingItemsCache.getOrRefresh({
      key: `reading:sessions:${limit}:${version}`,
      ttlMs: READING_TTL_MS,
      staleWhileRevalidateMs: READING_STALE_MS,
      loader: async () => ({ items: await getRecentReadingSessions(limit) }),
    });

    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/reading/sessions] failed", error);
    return c.json({ items: [] }, 500);
  }
});

export { readingRoutes };
