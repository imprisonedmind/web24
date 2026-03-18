import { Hono } from "hono";

import { AsyncCache } from "../lib/cache";
import { getCurrentlyWatching, getLastWatched } from "../services/tv";

const tvRoutes = new Hono();
const tvStatusCache = new AsyncCache<{
  currentlyWatching: Awaited<ReturnType<typeof getCurrentlyWatching>>;
  lastWatched: Awaited<ReturnType<typeof getLastWatched>>;
}>();
const TV_TTL_MS = 60_000;
const TV_STALE_MS = 5 * 60_000;

tvRoutes.get("/status", async c => {
  try {
    const cookieHeader = c.req.header("cookie");
    const payload = await tvStatusCache.getOrRefresh({
      key: `tv:status:${cookieHeader ?? "anon"}`,
      ttlMs: TV_TTL_MS,
      staleWhileRevalidateMs: TV_STALE_MS,
      loader: async () => {
        const [currentlyWatching, lastWatched] = await Promise.all([
          getCurrentlyWatching(cookieHeader),
          getLastWatched(cookieHeader)
        ]);

        return {
          currentlyWatching,
          lastWatched
        };
      }
    });

    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/tv/status] failed to fetch status", error);

    return c.json(
      {
        currentlyWatching: null,
        lastWatched: null
      },
      500
    );
  }
});

export { tvRoutes };
