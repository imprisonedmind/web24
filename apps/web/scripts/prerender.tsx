import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { publicRoutes, siteConfig } from "@web24/config";
import { getWritingPrerenderRoutes, getWritingRoutePath, writingPosts } from "@web24/content";

import { App } from "../src/app";

const distDir = path.resolve(import.meta.dir, "..", "dist");
const templatePath = path.join(distDir, "index.html");
const sitemapPath = path.join(distDir, "sitemap.xml");
const robotsPath = path.join(distDir, "robots.txt");

type SeoRoute = (typeof publicRoutes)[number];
type SitemapEntry = {
  path: string;
  lastModified?: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function parseWritingDate(value: string) {
  const match = value.match(/^(\d{1,2})\s([A-Za-z]{3})\s(\d{2})$/);
  if (!match) return undefined;

  const [, day, month, year] = match;
  const monthIndex = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  }[month];
  if (!monthIndex) return undefined;

  const isoDate = `20${year}-${monthIndex}-${day.padStart(2, "0")}T00:00:00.000Z`;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function buildSitemapXml(entries: SitemapEntry[]) {
  const body = entries
    .map((entry) => {
      const loc = escapeXml(encodeURI(`${siteConfig.url}${entry.path}`));
      const lastmod = entry.lastModified
        ? `\n    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`
        : "";

      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
    "",
  ].join("\n");
}

function buildRobotsTxt() {
  return [`User-agent: *`, `Allow: /`, ``, `Sitemap: ${siteConfig.url}/sitemap.xml`, ``].join("\n");
}

function injectHead(html: string, route: (typeof publicRoutes)[number]) {
  const canonicalUrl = `${siteConfig.url}${route.path}`;
  const title = route.seo.title;
  const description = route.seo.description;
  const image = `${siteConfig.url}${route.seo.image ?? siteConfig.defaultOgImage}`;

  return html.replace(
    "</head>",
    [
      `  <link rel="canonical" href="${canonicalUrl}" />`,
      `  <meta property="og:type" content="website" />`,
      `  <meta property="og:title" content="${title}" />`,
      `  <meta property="og:description" content="${description}" />`,
      `  <meta property="og:url" content="${canonicalUrl}" />`,
      `  <meta property="og:image" content="${image}" />`,
      `  <meta name="twitter:card" content="summary_large_image" />`,
      `  <meta name="twitter:title" content="${title}" />`,
      `  <meta name="twitter:description" content="${description}" />`,
      `  <meta name="twitter:image" content="${image}" />`,
      "</head>"
    ].join("\n")
  );
}

const originalError = console.error;

console.error = (...args) => {
  const first = args[0];
  if (
    typeof first === "string" &&
    first.includes("useLayoutEffect does nothing on the server")
  ) {
    return;
  }

  originalError(...args);
};

async function prerenderRoute(
  template: string,
  route: SeoRoute
) {
  const markup = renderToStaticMarkup(<App staticMode initialPath={route.path} />);

  const withTitle = template
    .replace(/<title>.*<\/title>/, `<title>${route.seo.title}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${route.seo.description}" />`
    )
    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`);

  const html = injectHead(withTitle, route);
  const routeDir =
    route.path === "/"
      ? distDir
      : path.join(distDir, route.path.replace(/^\//, ""));

  await mkdir(routeDir, { recursive: true });
  await writeFile(path.join(routeDir, "index.html"), html, "utf8");
}

async function writeSeoArtifacts() {
  const staticEntries = publicRoutes.map((route) => ({ path: route.path }));
  const writingEntries = writingPosts.map((post) => ({
    path: getWritingRoutePath(post),
    lastModified: parseWritingDate(post.date),
  }));

  const dedupedEntries = [...staticEntries, ...writingEntries].filter(
    (entry, index, items) => items.findIndex((candidate) => candidate.path === entry.path) === index,
  );

  await Promise.all([
    writeFile(sitemapPath, buildSitemapXml(dedupedEntries), "utf8"),
    writeFile(robotsPath, buildRobotsTxt(), "utf8"),
  ]);
}

async function main() {
  const template = await readFile(templatePath, "utf8");
  const routes = [...publicRoutes, ...getWritingPrerenderRoutes()];

  await Promise.all(routes.map(route => prerenderRoute(template, route)));
  await writeSeoArtifacts();
}

main().catch(error => {
  console.error("[prerender] failed", error);
  process.exit(1);
});
