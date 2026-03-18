import { useEffect } from "react";
import { Link, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { publicRoutes, siteConfig } from "@web24/config";

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
        {publicRoutes.map(route => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RoutePage
                title={route.label}
                body={routeBodies[route.path] ?? route.seo.description}
              />
            }
          />
        ))}
      </Route>
    </Routes>
  );
}
