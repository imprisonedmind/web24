import { Hono } from "hono";

import { cacheCurrentlyPlaying, getCurrentlyPlaying } from "../services/music";

const musicRoutes = new Hono();

musicRoutes.get("/currently-playing", async c => {
  try {
    const data = await getCurrentlyPlaying(true);
    cacheCurrentlyPlaying(data, true);
    return c.json(data, 200);
  } catch (error) {
    console.error("[api/music/currently-playing] failed", error);
    return c.json(null, 500);
  }
});

export { musicRoutes };
