# Next.js To Bun Monorepo Cutover Plan

## Goal

Migrate this repository from a single Next.js application to a Bun-based monorepo with:

- a pure Vite 8 SPA frontend
- a Hono backend for API and third-party integrations
- shared packages for UI, types, config, content, and API clients

This plan assumes:

- Bun is the runtime and package manager for all apps and packages
- the frontend will not use React SSR
- SEO requirements will be met with build-time prerendered HTML for public routes
- the backend will expose JSON APIs only

## Current Repo Assessment

The current repo is a single Next.js 15 app with Cloudflare OpenNext deployment residue.

Current characteristics:

- app router under `src/app`
- Next metadata APIs in route files and layout
- `next/image`, `next/link`, `next/navigation`, and `next/font/google`
- server actions used for Trakt/TMDB-backed activity data
- an API route at `src/app/api/tv/status/route.ts`
- environment handling split across `.env.local`, `wrangler.jsonc`, and `process.env`
- static data and content helpers already mostly portable

Main framework-coupled files and areas:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/writing/[...slug]/page.tsx`
- `src/app/api/tv/status/route.ts`
- `src/app/activity/actions/*`
- `src/lib/workData.ts`
- `src/lib/seo.ts`
- `src/lib/traktAuth.ts`

Main migration pressure points:

1. `next/image` and static asset imports
2. Next route metadata and SEO handling
3. server actions and cookie-based server runtime behavior
4. dynamic writing route rendering
5. Next-specific deployment setup with OpenNext/Cloudflare

## Target Architecture

Recommended monorepo layout:

```text
/
  apps/
    web/
    api/
  packages/
    ui/
    domain/
    content/
    clients/
    config/
  public/
  package.json
  bunfig.toml
  tsconfig.base.json
```

### apps/web

Responsibilities:

- Vite 8 React SPA
- client-side routing
- prerendered HTML generation for SEO-relevant public routes
- hydration after prerender
- no server-rendered React

### apps/api

Responsibilities:

- Hono API server
- Trakt, TMDB, Spotify, and future third-party integration access
- cookie/session handling if required
- token refresh and secret management
- health endpoints and internal API contracts

### packages/ui

Responsibilities:

- framework-agnostic React UI components
- shared styling primitives
- any reusable component currently not tied to Next APIs

### packages/domain

Responsibilities:

- shared TypeScript types
- route-level data contracts
- transformation logic for activity, writing, work items, and media objects

### packages/content

Responsibilities:

- content indexes
- writing data adapters
- work/project data
- static metadata definitions used by prerendering

### packages/clients

Responsibilities:

- typed frontend API client
- backend service clients for Trakt/TMDB/Spotify if shared abstractions are useful

### packages/config

Responsibilities:

- site config
- environment helpers
- shared constants
- TS config fragments if useful

## Frontend Strategy: Pure SPA With SEO

The frontend will be a pure SPA, but SEO should not rely on client-side rendering at request time.

The correct pattern is:

1. Vite builds the SPA
2. a prerender step generates route-specific HTML for public pages
3. each prerendered page includes route-specific title/meta/canonical/OG tags
4. the SPA hydrates after load and handles in-app navigation

This gives:

- crawlable HTML for bots and social scrapers
- simpler frontend runtime than SSR
- route-level SEO parity for stable public pages

This does not give request-time server rendering. That is acceptable if all SEO-relevant routes are enumerable at build time.

## Route Classification

Classify current routes into these buckets.

### Bucket A: Prerendered Public Routes

These should emit route-specific HTML during build:

- `/`
- `/activity`
- `/watched`
- `/watched/recent`
- `/watched/month`
- `/watched/months`
- `/watched/all-time`
- `/work`
- `/writing`
- `/writing/:slug...` for all known writing pages

### Bucket B: Client-Hydrated Dynamic Widgets

These should render shell HTML in prerender and fetch live data after hydration:

- TV status widget
- current watching panel
- last watched panel
- recent activity highlights
- music state widgets if still dynamic

### Bucket C: Backend-Only Endpoints

These move from Next server actions and route handlers into Hono:

- `/api/tv/status`
- activity/history endpoints
- current watching endpoint
- last watched endpoint
- watch highlights endpoint
- token refresh and integration helpers

## Route Mapping

### Current Next Route -> New Home

`src/app/page.tsx`

- move to SPA route in `apps/web`
- prerender at build

`src/app/work/page.tsx`

- move to SPA route in `apps/web`
- prerender at build

`src/app/writing/page.tsx`

- move to SPA route in `apps/web`
- prerender at build

`src/app/writing/[...slug]/page.tsx`

- move to SPA dynamic route in `apps/web`
- prerender all known slugs at build time

`src/app/activity/page.tsx`

- move to SPA route in `apps/web`
- prerender shell and SEO tags
- hydrate live widgets from API

`src/app/watched/*`

- move to SPA routes in `apps/web`
- prerender shell and SEO tags
- hydrate live sections as needed

`src/app/api/tv/status/route.ts`

- replace with Hono route in `apps/api`

`src/app/activity/actions/*`

- convert to explicit Hono handlers plus service modules

## Repository Restructure Plan

## Phase 0: Freeze And Inventory

Objective:

- establish a migration baseline

Work:

- inventory all current routes
- inventory all env vars
- inventory all external integrations
- inventory all image and public assets
- document current SEO tags per route
- capture API response shapes for live widgets

Deliverables:

- route matrix
- env matrix
- API contract notes
- baseline screenshots for critical pages

Exit criteria:

- current behavior is documented well enough to verify parity after cutover

## Phase 1: Create The Bun Workspace Monorepo

Objective:

- establish the final repository shape before moving feature code

Work:

- convert root `package.json` to Bun workspaces
- add root scripts for build, dev, lint, typecheck, and test
- add `tsconfig.base.json`
- move app-specific package manifests into `apps/web` and `apps/api`
- create initial package manifests in `packages/*`

Recommended root scripts:

- `bun run dev:web`
- `bun run dev:api`
- `bun run dev`
- `bun run build`
- `bun run typecheck`
- `bun run lint`

Exit criteria:

- workspace installs cleanly with Bun
- empty web/api apps can be started independently

## Phase 1A: Vite 8 Adoption Track

Objective:

- treat Vite 8 as a first-class migration workstream, not just a package replacement

Work:

- adopt Vite 8 directly in `apps/web`
- adopt `@vitejs/plugin-react` v6 with the Vite 8 stack
- validate all plugins and adapters specifically against Vite 8 and Rolldown
- design the frontend build around Vite 8 defaults instead of carrying forward older assumptions

Required decisions:

- router choice for SPA navigation
- prerender approach compatible with Vite 8
- whether React Compiler is needed
- whether any custom Babel behavior is still required
- whether any build customization depends on old Rollup or esbuild semantics

Exit criteria:

- `apps/web` is designed around Vite 8 conventions rather than a Vite 7-era compatibility posture

## Phase 2: Extract Shared Portable Code

Objective:

- separate framework-agnostic logic from Next-specific code

Work:

- move `src/lib/siteConfig.ts` into `packages/config`
- move `src/lib/envFile.ts` into `packages/config` or `packages/clients`
- move JSON content and content helpers into `packages/content`
- move shared types into `packages/domain`
- move generic utility functions into shared packages

Priority extraction targets:

- `src/lib/siteConfig.ts`
- `src/lib/envFile.ts`
- `src/lib/types.ts`
- `src/lib/blogData.json`
- `src/lib/reviewData.json`
- `src/lib/workData.ts` after image strategy is redesigned

Important note:

`src/lib/workData.ts` currently depends on `next/image` static import typing and imports from `/public/...`. It should be rewritten to use portable asset URLs or Vite-compatible imports before it can be cleanly shared.

Exit criteria:

- shared packages contain content/config/domain code without Next imports

## Phase 3: Build The Hono Backend

Objective:

- make backend behavior explicit and independent of the frontend framework

Work:

- create `apps/api` with Hono
- add service modules for Trakt/TMDB/Spotify
- move token refresh logic from `src/lib/traktAuth.ts`
- move activity/watch endpoints from Next server actions
- move TV status route from Next API route
- centralize secret/env loading in backend only

Proposed backend structure:

```text
apps/api/
  src/
    index.ts
    routes/
      tv.ts
      activity.ts
      health.ts
    services/
      trakt.ts
      tmdb.ts
      spotify.ts
    lib/
      env.ts
      auth.ts
      cookies.ts
      errors.ts
```

Initial endpoint set:

- `GET /api/health`
- `GET /api/tv/status`
- `GET /api/activity/currently-watching`
- `GET /api/activity/last-watched`
- `GET /api/activity/highlights`
- `GET /api/activity/history`

Backend rules:

- secrets never enter the frontend build
- third-party API traffic is routed through Hono
- cookie handling is explicit, not hidden in server actions
- cache headers are intentional and documented

Exit criteria:

- Hono API can fully replace current Next server actions and route handlers

## Phase 4: Build The Vite 8 SPA Shell

Objective:

- recreate the public app shell in a framework-neutral frontend

Work:

- scaffold `apps/web` with Vite 8 and React
- add client-side router
- move reusable components from `src/components` into either `apps/web` or `packages/ui`
- port global CSS and shared styles
- rebuild root layout and route shell

Likely direct replacements:

- `next/link` -> SPA router link component
- `next/navigation` -> SPA router navigation hooks
- `next/image` -> standard image component
- `next/font/google` -> self-hosted or local font loading

Important migration guidance:

- do not preserve Next abstractions artificially
- replace Next-only patterns with plain React + router + static assets
- keep SEO config data separate from component render logic

Exit criteria:

- web app boots under Vite and renders the public route shell

## Phase 5: Prerender Pipeline For SEO

Objective:

- preserve crawlable route HTML and route-specific metadata in a pure SPA model

Work:

- define route SEO config in a shared module
- define enumerated dynamic routes for writing pages
- build a prerender script that renders public routes to HTML
- inject route-specific head tags into the generated output
- ensure canonical and OG URLs use production-safe absolute URLs

Requirements:

- each public route gets static HTML output
- dynamic writing pages are fully enumerable at build time
- social card tags are present in the built HTML
- title and description are not dependent on client JS execution

SEO metadata to generate per route:

- `<title>`
- meta description
- canonical URL
- Open Graph title/description/url/image
- Twitter card metadata

Exit criteria:

- public route HTML artifacts contain route-specific head tags before hydration

## Phase 6: Port Public Routes

Objective:

- complete route parity for all public pages

Work order:

1. home
2. work
3. writing index
4. writing detail pages
5. activity page
6. watched pages
7. error and not-found behavior

Notes:

- content-heavy pages should move first because they are easier to verify
- dynamic activity widgets should hydrate from Hono endpoints after the page shell renders
- keep the route path structure stable unless a deliberate URL migration is planned

Exit criteria:

- all current public pages exist in the new SPA with equivalent content and metadata

## Phase 7: Asset And Image Migration

Objective:

- remove all dependency on Next image/runtime behavior

Work:

- audit all `/public` usage
- replace static `next/image` assumptions with portable image URLs or Vite imports
- define a single image strategy for:
  - work cards
  - writing cards
  - TV/media cards
  - author/profile images
- verify all OG and social images use absolute URL-safe references

Specific risk:

`src/lib/workData.ts` currently couples project data to imported image modules. Refactor this to store asset paths instead of imported typed image objects.

Exit criteria:

- no frontend module depends on Next image helpers or static image types

## Phase 8: Environment And Runtime Migration

Objective:

- separate browser-safe config from backend secrets cleanly

Work:

- define env conventions for `apps/web`
- define env conventions for `apps/api`
- remove dependency on Next env naming except where intentionally preserved
- move secret-only logic entirely behind the API

Recommended split:

Frontend env:

- public site URL
- public feature flags if needed

Backend env:

- `TRAKT_CLIENT_ID`
- `TRAKT_CLIENT_SECRET`
- `TRAKT_ACCESS_TOKEN`
- `TRAKT_REFRESH_TOKEN`
- `TMDB_KEY`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- any token metadata required for refresh

Rules:

- no secret should be embedded in prerender output
- no secret should be exposed via client bundles
- local development should support running web and api separately

Exit criteria:

- env loading is explicit and environment-specific

## Phase 9: Staging Parallel Run

Objective:

- verify parity while keeping the current Next app as fallback

Work:

- deploy the new Vite SPA + Hono API to staging
- keep Next production behavior available until parity is proven
- compare rendered route output and API responses
- verify bot-visible HTML for prerendered pages

Parity checklist:

- route paths
- page titles
- meta descriptions
- canonical tags
- OG tags
- Twitter tags
- image loading
- writing content rendering
- activity data widgets
- watched pages
- 404 behavior

Exit criteria:

- staging parity is good enough for production switch

## Phase 10: Production Cutover

Objective:

- switch production traffic to the monorepo stack

Work:

- point hosting to the new SPA deployment
- point API traffic to Hono backend
- verify production envs
- run smoke checks on public pages and activity endpoints

Cutover steps:

1. build and deploy API
2. build and deploy web prerendered SPA
3. verify health endpoint
4. verify homepage and writing detail HTML output
5. verify live widgets after hydration
6. switch traffic
7. monitor logs and API failures

Exit criteria:

- production traffic is fully on the new stack

## Phase 11: Remove Next.js Residue

Objective:

- complete the migration and reduce maintenance surface

Remove after stable cutover:

- `next`
- `eslint-config-next`
- `@opennextjs/cloudflare`
- `next.config.js`
- `open-next.config.ts`
- `.open-next/`
- `.next/`
- Next app router files no longer needed
- Cloudflare/OpenNext deployment config that only exists for Next

Also update:

- `README.md`
- developer scripts
- CI/CD pipeline
- deployment notes

Exit criteria:

- repo no longer depends on Next/OpenNext anywhere

## Detailed Migration Risks

## 1. SEO Risk In Pure SPA Mode

Risk:

- relying on client-only head updates will weaken crawler and social preview behavior

Mitigation:

- prerender all public SEO-relevant routes at build time
- validate generated HTML directly, not just browser-rendered output

## 2. Dynamic Writing Route Risk

Risk:

- if writing detail routes are not enumerable at build time, prerender parity breaks

Mitigation:

- build a deterministic content index before prerender
- fail builds when writing routes cannot be enumerated

## 3. Asset Migration Risk

Risk:

- `next/image` and imported static asset assumptions may break layout or builds

Mitigation:

- adopt one image strategy early
- refactor `workData` before broad component porting

## 4. Hidden Backend Coupling Risk

Risk:

- server actions currently hide backend boundaries and cache behavior

Mitigation:

- move all backend logic to explicit Hono handlers and service modules
- define response contracts and cache rules

## 5. Env Leakage Risk

Risk:

- moving to a prerendered SPA can accidentally expose server env values if build scripts are careless

Mitigation:

- strictly separate frontend-safe envs from backend secrets
- inspect built artifacts during staging

## Route-By-Route Conversion Notes

### Home

Current behavior:

- metadata-rich landing page
- static content plus client widgets

New behavior:

- prerender full page shell and metadata
- hydrate live widgets after load

### Work

Current behavior:

- static portfolio content

New behavior:

- fully prerendered
- no runtime backend dependency expected

### Writing Index

Current behavior:

- content listing and SEO metadata

New behavior:

- fully prerendered

### Writing Detail

Current behavior:

- dynamic slug route with generated metadata

New behavior:

- pre-enumerated routes prerendered at build time
- metadata generated from content index

### Activity

Current behavior:

- server-backed watching data with metadata

New behavior:

- prerender static shell and metadata
- hydrate activity cards from Hono API

### Watched

Current behavior:

- mixed content and live media data

New behavior:

- prerender static route shell and metadata
- fetch live or semi-cached data from Hono

## Recommended Sequencing

The safest order is:

1. workspace scaffold
2. shared package extraction
3. Hono API parity
4. Vite SPA shell
5. prerender pipeline
6. static/content routes
7. dynamic activity/watched routes
8. staging parity run
9. production cutover
10. cleanup

This order keeps the migration grounded in explicit backend APIs before the frontend rewrite reaches the hardest routes.

## Suggested Deliverables

By the end of the migration, the repo should contain:

- Bun workspace monorepo
- `apps/web` Vite 8 SPA
- `apps/api` Hono backend
- shared `packages/*`
- prerender script and route manifest
- updated README and developer scripts
- no Next/OpenNext dependencies

## Suggested Acceptance Criteria

The migration is complete when:

- all public routes work in the new frontend
- all current live widgets fetch via Hono
- writing routes are prerendered with route-specific metadata
- built HTML contains canonical and social meta tags
- all secrets remain backend-only
- Bun is the only package manager/runtime used in normal development
- Next/OpenNext files and dependencies are removed

## Vite 8 Strategy

Vite 8 is not only a version bump. It changes the underlying toolchain and should be treated as part of the architecture decision for the new frontend.

This migration should assume Vite 8 features and defaults are intentional parts of the target stack.

### Why Vite 8 Matters For This Repo

This repo is moving from a framework-heavy Next runtime to a thinner SPA runtime. That means:

- the frontend build tool becomes more central
- plugin behavior matters more
- asset handling and route prerendering are now Vite concerns
- developer workflows will be shaped directly by Vite rather than indirectly by Next

For this reason, Vite 8 coverage should be explicit in the migration plan.

### Core Vite 8 Changes We Should Design Around

#### 1. Rolldown Is Now The Primary Bundler

Vite 8 uses Rolldown instead of the older Rollup + esbuild split for core bundling flows.

Implications for this repo:

- plugin compatibility must be verified under Rolldown, not assumed from older Vite setups
- custom build behavior should avoid depending on old Rollup-only quirks
- performance-sensitive production builds should benefit automatically
- any future optimization work should prefer Rolldown-native options

Practical planning rule:

- if a plugin is optional and not clearly Vite 8 / Rolldown compatible, avoid it unless it solves a real need

#### 2. Oxc Replaces esbuild In More Of The Pipeline

Vite 8 uses Oxc-based transforms and minification paths in areas previously handled by esbuild.

Implications for this repo:

- old `esbuild` config habits should not be carried over blindly
- if we need custom transforms, we should prefer the newer Oxc-oriented path
- any build breakage involving transforms or minification should be investigated as a Vite 8/Oxc issue first, not assumed to be app code

Practical planning rule:

- avoid introducing legacy `esbuild` customization unless a plugin or dependency strictly requires it

#### 3. Dependency Optimization Uses Rolldown

The dependency optimizer now uses Rolldown, and `optimizeDeps.esbuildOptions` is deprecated in favor of `optimizeDeps.rolldownOptions`.

Implications for this repo:

- if optimization tuning is needed later, target the Rolldown config surface
- do not design the new app around deprecated `esbuildOptions`

#### 4. JavaScript Minification Uses Oxc

Vite 8 now uses Oxc for JS minification by default.

Implications for this repo:

- production build verification should include a minified build smoke test
- if minification causes regressions, debug against Oxc assumptions
- do not build future custom minification behavior around removed esbuild assumptions

#### 5. CSS Tooling Is Stronger Out Of The Box

Vite 8 now bundles Lightning CSS as a normal dependency for better CSS minification out of the box.

Implications for this repo:

- CSS output quality and performance should improve without extra work
- frontend styling choices should prefer standard CSS patterns over build-time complexity where possible

#### 6. React Plugin Changes Matter

The official React plugin line released alongside Vite 8 is `@vitejs/plugin-react` v6.

Implications for this repo:

- prefer `@vitejs/plugin-react` v6 as the default React integration
- do not default to older Babel-heavy setups
- if React Compiler is needed, plan it explicitly rather than making Babel part of the baseline stack

### Vite 8 Work We Should Explicitly Include

The migration should include these Vite 8-specific tasks.

#### Tooling Validation

- confirm all chosen Vite plugins support Vite 8
- confirm prerender tooling works under Vite 8 and Rolldown
- confirm any path alias handling behaves correctly under the new toolchain
- confirm asset handling for images and CSS behaves correctly in both dev and production builds

#### Config Migration

- avoid deprecated `esbuild` configuration in the new app
- avoid relying on old Rollup-specific config unless verified
- use the Vite 8 config surface intentionally
- keep `vite.config.ts` small and understandable

#### Performance Adoption

- use Vite 8 defaults first before layering optimization
- benchmark dev startup, rebuild speed, and production build time after the initial port
- keep performance notes as part of staging verification, not a post-migration afterthought

#### Plugin Discipline

- prefer fewer plugins
- prefer official Vite plugins where possible
- prefer simple router/prerender stacks over complex meta-framework-like layering
- reject plugins that only recreate Next features we are intentionally leaving behind

### Vite 8 Bells And Whistles We Should Aim To Use

These are the capabilities or ecosystem improvements we should treat as part of the target experience.

#### Official React Integration

- `@vitejs/plugin-react` v6
- Oxc-based React Refresh path
- explicit React Compiler opt-in only if needed

#### Rolldown-Based Performance

- faster production builds
- more consistent bundling behavior across the toolchain
- better future headroom for scaling the SPA

#### Modern Plugin Discovery

Vite now points developers to `registry.vite.dev` as a searchable plugin directory for Vite, Rolldown, and Rollup plugins.

Planning implication:

- plugin selection during the migration should use the Vite ecosystem registry and official docs, not generic historical blog posts

#### Environment API Awareness

Vite 8 continues the Environment API work. Even though this repo is targeting a pure SPA rather than SSR or a custom runtime, we should be aware of it when choosing tooling.

Planning implication:

- prefer prerender and frontend tooling that aligns cleanly with the Vite 8 environment model
- avoid custom runtime abstractions that fight Vite's direction unless there is a hard need

#### Future Scaling Path

The Vite 8 announcement also calls out work on Full Bundle Mode as an experimental future direction for larger apps.

Planning implication:

- we do not need to adopt experimental modes for the initial migration
- we should keep the frontend architecture simple enough that future Vite 8+ performance features remain easy to adopt

### Vite 8 Compatibility Checklist

Before production cutover, confirm all of the following:

- `vite` is on a stable 8.x release
- `@vitejs/plugin-react` is on the matching major line
- no critical plugin relies on deprecated `esbuild` config paths
- no critical config depends on unsupported Rollup-only options
- dev startup works under Bun-driven workflows
- production build works and is smoke tested in minified mode
- prerender output is stable under Vite 8 builds
- static assets resolve correctly in both dev and build output
- CI uses a Node version compatible with Vite 8 tooling expectations where Node is involved

### Vite 8 Constraints To Document In This Repo

These should be written into the final README or contributor docs after migration:

- Vite 8 requires Node.js 20.19+ or 22.12+ for Node-based tooling compatibility
- Bun is the primary runtime/package manager for this repo, but CI and some tools may still invoke Node-compatible Vite behavior
- plugin additions must be checked for Vite 8 and Rolldown compatibility
- deprecated `esbuild`-specific config should not be added to the codebase

### Suggested `apps/web` Baseline

The frontend baseline should be:

- Vite 8
- React
- `@vitejs/plugin-react` v6
- TypeScript
- client-side router
- prerender step for public routes
- minimal plugin surface
- path aliases only if they stay simple and verifiable

### Suggested Verification For Vite 8 Adoption

During migration, run and record:

- cold dev startup time
- route navigation behavior in dev
- production build time
- prerender generation time
- bundle output sanity checks
- built HTML head/meta verification
- asset resolution checks

These measurements do not need to be perfect benchmarks. They are there to confirm we are actually benefiting from the Vite 8 toolchain and not fighting it.

## Vite 8 Notes

This plan assumes the frontend aligns with the current Vite 8 release and migration guidance from the official Vite documentation.

The main operational implications to keep in mind are:

- adopt the Vite 8 environment and workflow conventions from the official release
- account for its current Node compatibility expectations in CI/tooling even if Bun is the primary runtime
- validate any plugins used for prerendering or router integration against Vite 8 specifically

Official references:

- https://vite.dev/blog/announcing-vite8
- https://vite.dev/guide/migration
- https://vite.dev/guide/api-environment-instances

## Final Recommendation

Proceed with a strict SPA + prerender + API separation:

- SPA for application simplicity
- prerender for SEO and social sharing
- Hono for all server-side behavior
- Bun for package management and runtime

Do not try to preserve Next-era patterns in disguise. Extract portable logic, make backend boundaries explicit, and make prerendering a first-class build step from the start.
