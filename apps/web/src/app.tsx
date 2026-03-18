import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams
} from "react-router-dom";

import { publicRoutes, siteConfig } from "@web24/config";
import {
  getFeaturedWorkItems,
  getWritingPostBySlugParts,
  getWritingRoutePath,
  sortWritingPosts
} from "@web24/content";

import "./styles.css";

function useRouteSeo() {
  const location = useLocation();

  useEffect(() => {
    const route = publicRoutes.find(candidate => candidate.path === location.pathname);
    if (!route) return;

    document.title = route.seo.title;

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", route.seo.description);
    }
  }, [location.pathname]);
}

function NavItem({
  href,
  label,
  staticMode
}: {
  href: string;
  label: string;
  staticMode?: boolean;
}) {
  if (staticMode) {
    return (
      <a className="nav-link" href={href}>
        {label}
      </a>
    );
  }

  return (
    <Link className="nav-link" to={href}>
      {label}
    </Link>
  );
}

function AppFrame({ staticMode = false }: { staticMode?: boolean }) {
  useRouteSeo();

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Cutover in progress</p>
        <h1>{siteConfig.title}</h1>
        <p className="lede">
          The new frontend is a Vite 8 SPA with prerendered public routes and a
          Hono API. This shell is the first migration milestone.
        </p>
        <nav className="nav">
          {publicRoutes.map(route => (
            <NavItem
              key={route.path}
              href={route.path}
              label={route.label}
              staticMode={staticMode}
            />
          ))}
        </nav>
      </header>

      <Outlet />
    </main>
  );
}

function RoutePage({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="card route-card">
      <p className="route-kicker">Public route</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}

type TvStatus = {
  currentlyWatching: {
    type: "movie" | "show" | "episode";
    title: string;
    showTitle?: string;
    episodeTitle?: string;
    season?: number;
    episode?: number;
    posterUrl: string;
    url: string;
    progress?: number;
    startedAt?: string;
    expiresAt?: string;
  } | null;
  lastWatched: {
    type: "movie" | "show" | "episode";
    title: string;
    showTitle?: string;
    episodeTitle?: string;
    season?: number;
    episode?: number;
    posterUrl: string;
    watchedAt: string;
    url: string;
  } | null;
};

function getEpisodeCode(
  status: TvStatus["currentlyWatching"] | TvStatus["lastWatched"]
) {
  if (!status || status.type !== "episode") return null;
  if (typeof status.season === "number" && typeof status.episode === "number") {
    return `${status.season}x${status.episode}`;
  }
  return null;
}

function getDisplayTitle(
  entry: TvStatus["currentlyWatching"] | TvStatus["lastWatched"]
) {
  if (!entry) return "Nothing watched yet";
  if (entry.type === "episode") return entry.showTitle ?? entry.title ?? "Untitled";
  return entry.title ?? "Untitled";
}

function getDisplaySubtitle(
  entry: TvStatus["currentlyWatching"] | TvStatus["lastWatched"]
) {
  if (!entry) return null;
  if (entry.type !== "episode") return null;

  const code = getEpisodeCode(entry);
  return [code, entry.episodeTitle].filter(Boolean).join(" • ") || null;
}

function formatDistanceLabel(value: string) {
  const diffMs = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function TvStatusPanel() {
  const [status, setStatus] = useState<TvStatus>({
    currentlyWatching: null,
    lastWatched: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/tv/status", {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error(`tv status failed with ${response.status}`);
        }

        const data = (await response.json()) as Partial<TvStatus>;
        if (!cancelled) {
          setStatus({
            currentlyWatching: data.currentlyWatching ?? null,
            lastWatched: data.lastWatched ?? null
          });
        }
      } catch (error) {
        console.error("[spa/activity] failed to load tv status", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const interval = window.setInterval(load, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const activeEntry = status.currentlyWatching ?? status.lastWatched;
  const metaLabel = status.currentlyWatching
    ? [
        getEpisodeCode(status.currentlyWatching),
        typeof status.currentlyWatching.progress === "number"
          ? `${Math.round(status.currentlyWatching.progress)}%`
          : null
      ]
        .filter(Boolean)
        .join(" • ")
    : status.lastWatched?.watchedAt
      ? formatDistanceLabel(status.lastWatched.watchedAt)
      : null;

  return (
    <section className="route-stack">
      <section className="card route-card">
        <p className="route-kicker">Activity</p>
        <h2>Live TV status via Hono</h2>
        <p>
          This route is now backed by the new API service instead of the old
          Next route handler. It is the first dynamic frontend path using the
          new backend.
        </p>
      </section>

      <section className="activity-grid">
        <article className="activity-card activity-poster-card">
          {activeEntry ? (
            <a href={activeEntry.url} target="_blank" rel="noreferrer">
              <img
                className="activity-poster"
                src={activeEntry.posterUrl}
                alt={activeEntry.title}
              />
            </a>
          ) : (
            <div className="activity-empty">
              {loading ? "Loading activity…" : "Nothing watched yet"}
            </div>
          )}
        </article>

        <article className="activity-card activity-copy-card">
          <p className="route-kicker">
            {status.currentlyWatching ? "Currently watching" : "Last watched"}
          </p>
          <h3>{getDisplayTitle(activeEntry)}</h3>
          {getDisplaySubtitle(activeEntry) ? (
            <p className="activity-subtitle">{getDisplaySubtitle(activeEntry)}</p>
          ) : null}
          {metaLabel ? <p className="activity-meta">{metaLabel}</p> : null}
          <p className="activity-body">
            {status.currentlyWatching
              ? "Live watch state is now coming from the Hono backend and can replace the old Next server-action path."
              : "Once more activity endpoints are migrated, this route will expand into the full watched and highlights experience."}
          </p>
        </article>
      </section>
    </section>
  );
}

function WorkRoute() {
  const featured = getFeaturedWorkItems(6);

  return (
    <section className="route-stack">
      <section className="card route-card">
        <p className="route-kicker">Work</p>
        <h2>Selected projects</h2>
        <p>
          This is the first real content route moved onto the Vite SPA shell.
          The data now lives in a shared package with portable image paths
          instead of Next-specific static imports.
        </p>
      </section>

      <section className="work-grid" aria-label="Featured work">
        {featured.map(item => (
          <a
            key={item.title}
            className="work-card"
            href={item.link}
            target={item.internal ? "_self" : "_blank"}
            rel={item.internal ? undefined : "noreferrer"}
          >
            <img className="work-image" src={item.image} alt={item.alt} loading="lazy" />
            <div className="work-copy">
              <div className="work-meta">
                <span className="work-tag">{item.tag}</span>
                <span className="work-year">{item.year}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description ?? item.alt}</p>
            </div>
          </a>
        ))}
      </section>
    </section>
  );
}

function WritingRoute() {
  const posts = sortWritingPosts();

  return (
    <section className="route-stack">
      <section className="card route-card">
        <p className="route-kicker">Writing</p>
        <h2>Published notes, essays, and reviews</h2>
        <p>
          The writing index is now sourced from a shared content package. This
          becomes the route manifest for build-time prerendering and future
          detail-page migration.
        </p>
      </section>

      <section className="writing-grid" aria-label="Writing posts">
        {posts.map(post => (
          <a key={post.id} className="writing-card" href={getWritingRoutePath(post)}>
            <img
              className="writing-image"
              src={`/${post.openGraph}`}
              alt={post.title}
              loading="lazy"
            />
            <div className="writing-copy">
              <div className="writing-meta">
                <span>{post.date}</span>
                {post.score !== undefined ? <span>{post.score.toFixed(1)}</span> : null}
              </div>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
            </div>
          </a>
        ))}
      </section>
    </section>
  );
}

function WritingDetailRoute() {
  const params = useParams<{ slug: string; id: string }>();
  const post = getWritingPostBySlugParts(params.slug, params.id);

  if (!post) {
    return <Navigate to="/writing" replace />;
  }

  return (
    <section className="route-stack">
      <section className="card route-card">
        <p className="route-kicker">Writing Detail</p>
        <h2>{post.title}</h2>
        <p>{post.description}</p>
      </section>

      <article className="writing-detail">
        <img
          className="writing-detail-image"
          src={`/${post.openGraph}`}
          alt={post.title}
        />
        <div className="writing-detail-meta">
          <span>{post.date}</span>
          {post.score !== undefined ? <span>score {post.score.toFixed(1)}</span> : null}
        </div>
        <p className="writing-detail-copy">
          This page is now part of the prerendered route manifest for the Vite
          SPA. The next migration step is replacing this extracted summary view
          with the full Notion-backed content rendering path.
        </p>
      </article>
    </section>
  );
}

const routeBodies: Record<string, string> = {
  "/":
    "Home will be rebuilt first, then connected to extracted content and live widgets from the new API.",
  "/work":
    "Work is a strong early migration target because it is mostly static and suitable for prerender parity.",
  "/writing":
    "Writing will be backed by a content index so both the route list and SEO metadata can be generated at build time.",
  "/activity":
    "Activity will prerender a stable shell and hydrate current watching data from Hono after load.",
  "/watched":
    "Watched routes will follow the same pattern as activity: crawlable HTML first, live data second."
};

export function App({ staticMode = false }: { staticMode?: boolean }) {
  return (
    <Routes>
      <Route element={<AppFrame staticMode={staticMode} />}>
        <Route path="/writing/:slug/:id" element={<WritingDetailRoute />} />
        {publicRoutes.map(route => (
          <Route
            key={route.path}
            path={route.path}
            element={route.path === "/work" ? (
              <WorkRoute />
            ) : route.path === "/writing" ? (
              <WritingRoute />
            ) : route.path === "/activity" ? (
              <TvStatusPanel />
            ) : (
              <RoutePage
                title={route.label}
                body={routeBodies[route.path] ?? route.seo.description}
              />
            )}
          />
        ))}
      </Route>
    </Routes>
  );
}
