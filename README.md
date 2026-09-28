# web24

Personal site monorepo with a Vite SPA frontend and Hono API deployed as a Cloudflare Worker with Workers Assets.

## Development

```bash
bun run dev
```

The web app runs through Vite on `http://localhost:5173` and proxies `/api` to the local Bun API on `http://localhost:3001`.

## Environment

Local env values live in the repo-root `.env.local` file.

Required public build variable:

```dotenv
VITE_SITE_URL=https://example.com
```

Required server/runtime variable:

```dotenv
CONVEX_URL=https://example.convex.cloud
```

`apps/web/vite.config.ts` points Vite at the repo root with `envDir`, so Vite loads `.env`, `.env.local`, and mode-specific env files directly. Browser-visible values must use the `VITE_` prefix.

Cloudflare Worker variables are read from runtime bindings. This repo keeps static production values out of `wrangler.jsonc`; set `VITE_SITE_URL`, `CONVEX_URL`, and secrets in the Cloudflare dashboard, and `keep_vars` preserves those dashboard values on deploy.

## Trakt Browser Sync

The local browser sync uses a dedicated Chromium-based browser profile and Trakt's signed-in web session. The session stays on the local machine; only normalized watch data is written to Convex.

Sign in once:

```bash
bun run trakt:browser:login
```

Then sync the trailing 90 days whenever needed:

```bash
bun run trakt:browser:sync
```

Use `--days <number>` for a different window or `--full` for a complete history sync. The CLI auto-detects Chromium, Helium, and Chrome on macOS; set `TRAKT_BROWSER_EXECUTABLE` in `.env.local` only for a non-standard location. The browser profile defaults to `~/.web24/trakt-browser-profile` and can be overridden with `TRAKT_BROWSER_PROFILE_DIR`.

## Build And Deploy

```bash
bun run build
bun run deploy:edge
```
