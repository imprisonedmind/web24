type RuntimeEnv = {
  SITE_URL?: string;
  VITE_SITE_URL?: string;
};

function readRuntimeEnv(): RuntimeEnv {
  const env: RuntimeEnv = {};

  if (
    typeof import.meta !== "undefined" &&
    typeof import.meta.env !== "undefined"
  ) {
    env.SITE_URL = import.meta.env.SITE_URL;
    env.VITE_SITE_URL = import.meta.env.VITE_SITE_URL;
  }

  if (typeof process !== "undefined" && process.env) {
    env.SITE_URL ??= process.env.SITE_URL;
    env.VITE_SITE_URL ??= process.env.VITE_SITE_URL;
  }

  return env;
}

const runtimeEnv = readRuntimeEnv();

const rawSiteUrl =
  runtimeEnv.SITE_URL ??
  runtimeEnv.VITE_SITE_URL ??
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
