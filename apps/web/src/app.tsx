import { useEffect } from "react";
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
