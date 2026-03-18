import { Hono } from "hono";

import { siteConfig, vite8FeatureFlags } from "@web24/config";
import { getCurrentlyPlaying } from "./services/music";
import { musicRoutes } from "./routes/music";
import { tvRoutes } from "./routes/tv";
import { watchedRoutes } from "./routes/watched";

const app = new Hono();

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
app.route("/api/music", musicRoutes);
app.get("/api/currentlyPlaying", async c => {
  try {
    return c.json(await getCurrentlyPlaying(true), 200);
  } catch (error) {
    console.error("[api/currentlyPlaying] failed", error);
    return c.json(null, 500);
  }
});

const server = Bun.serve({
  port: 3001,
  fetch: app.fetch
});

console.log(
  `[web24-api] listening on http://localhost:${server.port} for ${siteConfig.url}`
);
