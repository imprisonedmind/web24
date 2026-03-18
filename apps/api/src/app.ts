import { Hono } from "hono";

import { siteConfig, vite8FeatureFlags } from "@web24/config";
import { activityRoutes } from "./routes/activity";
import { cacheCurrentlyPlaying, getCurrentlyPlaying } from "./services/music";
import { musicRoutes } from "./routes/music";
import { tvRoutes } from "./routes/tv";
import { watchedRoutes } from "./routes/watched";
import { writingRoutes } from "./routes/writing";

export const app = new Hono();

app.get("/api/health", c => {
  return c.json({
    ok: true,
    app: "web24-api",
    siteUrl: siteConfig.url
  });
});

app.get("/api/migration/status", c => {
  return c.json({
    phase: "scaffold",
    frontend: "vite8-spa",
    backend: "hono",
    vite8: vite8FeatureFlags
  });
});

app.route("/api/tv", tvRoutes);
app.route("/api/watched", watchedRoutes);
app.route("/api/activity", activityRoutes);
app.route("/api/music", musicRoutes);
app.route("/api/writing", writingRoutes);
app.get("/api/currentlyPlaying", async c => {
  try {
    const data = await getCurrentlyPlaying(true);
    cacheCurrentlyPlaying(data, true);
    return c.json(data, 200);
  } catch (error) {
    console.error("[api/currentlyPlaying] failed", error);
    return c.json(null, 500);
  }
});
