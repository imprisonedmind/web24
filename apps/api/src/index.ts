import { Hono } from "hono";

import { siteConfig, vite8FeatureFlags } from "@web24/config";

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

const server = Bun.serve({
  port: 3001,
  fetch: app.fetch
});

console.log(
  `[web24-api] listening on http://localhost:${server.port} for ${siteConfig.url}`
);
