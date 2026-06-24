import { Hono } from "hono";

import { vite8FeatureFlags } from "@web24/config";
import { getRequiredSiteUrl } from "./lib/siteUrl";
import { activityRoutes } from "./routes/activity";
import { cacheCurrentlyPlaying, getCurrentlyPlaying } from "./services/music";
import { musicRoutes } from "./routes/music";
import { readingRoutes } from "./routes/reading";
import { tvRoutes } from "./routes/tv";
import { watchedRoutes } from "./routes/watched";
import { writingRoutes } from "./routes/writing";
import { gamingRoutes } from "./routes/gaming";

type ApiEnv = {
  Bindings: {
    VITE_SITE_URL?: string;
  };
};

export const app = new Hono<ApiEnv>();

app.get("/api/health", c => {
  return c.json({
    ok: true,
    app: "web24-api",
    siteUrl: getRequiredSiteUrl(c.env)
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
app.route("/api/reading", readingRoutes);
app.route("/api/writing", writingRoutes);
app.route("/api/gaming", gamingRoutes);
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
