import { Hono } from "hono";

import { getFullActivityDays, getHomeActivityDays } from "../services/activity";

const activityRoutes = new Hono();

activityRoutes.get("/home", async c => {
  try {
    const days = await getHomeActivityDays(c.req.header("cookie"));
    return c.json({ days }, 200);
  } catch (error) {
    console.error("[api/activity/home] failed", error);
    return c.json({ days: [] }, 500);
  }
});

activityRoutes.get("/full", async c => {
  try {
    const payload = await getFullActivityDays(c.req.header("cookie"));
    return c.json(payload, 200);
  } catch (error) {
    console.error("[api/activity/full] failed", error);
    return c.json({ watchingDays: [], workSections: [] }, 500);
  }
});

export { activityRoutes };
