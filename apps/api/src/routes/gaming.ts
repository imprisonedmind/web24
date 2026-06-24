import { Hono } from "hono";
import { getSyncedGamingStatus } from "../lib/convex";

const gamingRoutes = new Hono();

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

export { gamingRoutes };
