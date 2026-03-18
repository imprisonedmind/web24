import React from "react";
import ReactDOM from "react-dom/client";

import { siteConfig, vite8FeatureFlags } from "@web24/config";

import "./styles.css";

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Cutover in progress</p>
        <h1>{siteConfig.title}</h1>
        <p className="lede">
          This Vite 8 app is the new SPA shell for the monorepo migration. The
          current Next.js app remains in place while routes, data clients, and
          SEO prerendering are moved over incrementally.
        </p>
      </section>

      <section className="card-grid" aria-label="Migration milestones">
        <article className="card">
          <h2>Frontend</h2>
          <p>Vite 8 SPA with React and a route prerender pipeline.</p>
        </article>
        <article className="card">
          <h2>Backend</h2>
          <p>Hono API for Trakt, TMDB, and future integrations.</p>
        </article>
        <article className="card">
          <h2>Tooling</h2>
          <p>{vite8FeatureFlags.join(" • ")}</p>
        </article>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
