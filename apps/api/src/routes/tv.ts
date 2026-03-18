import { Hono } from "hono";

import { getCurrentlyWatching, getLastWatched } from "../services/tv";

const tvRoutes = new Hono();

tvRoutes.get("/status", async c => {
  try {
    const cookieHeader = c.req.header("cookie");
    const [currentlyWatching, lastWatched] = await Promise.all([
      getCurrentlyWatching(cookieHeader),
      getLastWatched(cookieHeader)
    ]);

    return c.json(
      {
        currentlyWatching,
        lastWatched
      },
      200
    );
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
