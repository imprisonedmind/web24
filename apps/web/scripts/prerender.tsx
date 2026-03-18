import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { publicRoutes, siteConfig } from "@web24/config";
import { getWritingPrerenderRoutes } from "@web24/content";

import { App } from "../src/app";

const distDir = path.resolve(import.meta.dir, "..", "dist");
const templatePath = path.join(distDir, "index.html");

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
  route: (typeof publicRoutes)[number]
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

async function main() {
  const template = await readFile(templatePath, "utf8");
  const routes = [...publicRoutes, ...getWritingPrerenderRoutes()];

  await Promise.all(routes.map(route => prerenderRoute(template, route)));
}

main().catch(error => {
  console.error("[prerender] failed", error);
  process.exit(1);
});
