import { hydrateProcessEnvFromRoot } from "./lib/runtimeEnv";
import { siteConfig } from "@web24/config";
import { app } from "./app";

await hydrateProcessEnvFromRoot();

const server = Bun.serve({
  port: 3001,
  fetch: app.fetch
});

console.log(
  `[web24-api] listening on http://localhost:${server.port} for ${siteConfig.url}`
);
