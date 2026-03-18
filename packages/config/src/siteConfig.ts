const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  process.env.VITE_SITE_URL ??
  "https://lukestephens.co.za";

const normalizedSiteUrl = rawSiteUrl.replace(/\/$/, "");

export const siteConfig = {
  title: "Luke Stephens",
  description:
    "Luke Stephens — software designer and persistent tinkerer sharing work, writing, and activity logs.",
  url: normalizedSiteUrl,
  defaultOgImage: "/luke2.jpg",
  openGraphLogo: "/faviconX167.svg",
  twitterSite: "@site",
  twitterCreator: "@lukey_stephens"
} as const;

export const vite8FeatureFlags = [
  "Rolldown builds",
  "Oxc transforms",
  "Vite DevTools",
  "tsconfig path resolution",
  "forwarded browser console"
] as const;
