import { Hono } from "hono";

import { getRecentlyWatched } from "../services/watched";

const watchedRoutes = new Hono();

watchedRoutes.get("/recent", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "12");
    const cookieHeader = c.req.header("cookie");
    const items = await getRecentlyWatched(limit, cookieHeader);

    return c.json({ items }, 200);
  } catch (error) {
    console.error("[api/watched/recent] failed", error);
    return c.json({ items: [] }, 500);
  }
});

export { watchedRoutes };
