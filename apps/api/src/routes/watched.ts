import { Hono } from "hono";

import {
  getMostWatchedAllTime,
  getMostWatchedForMonth,
  getMostWatchedPast30Days,
  getRecentlyWatched,
  getWatchDaysLastYear
} from "../services/watched";

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

watchedRoutes.get("/month", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "12");
    const items = await getMostWatchedPast30Days(limit, c.req.header("cookie"));
    return c.json({ items }, 200);
  } catch (error) {
    console.error("[api/watched/month] failed", error);
    return c.json({ items: [] }, 500);
  }
});

watchedRoutes.get("/all-time", async c => {
  try {
    const limit = Number(c.req.query("limit") ?? "12");
    const items = await getMostWatchedAllTime(limit, c.req.header("cookie"));
    return c.json({ items }, 200);
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
    const items = await getMostWatchedForMonth(monthIso, limit, c.req.header("cookie"));
    return c.json({ items }, 200);
  } catch (error) {
    console.error("[api/watched/monthly] failed", error);
    return c.json({ items: [] }, 500);
  }
});

watchedRoutes.get("/days-last-year", async c => {
  try {
    const days = await getWatchDaysLastYear(c.req.header("cookie"));
    return c.json({ days }, 200);
  } catch (error) {
    console.error("[api/watched/days-last-year] failed", error);
    return c.json({ days: [] }, 500);
  }
});

export { watchedRoutes };
