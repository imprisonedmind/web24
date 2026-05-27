export const PUBLIC_SITE_URL_ENV_KEY = "VITE_SITE_URL" as const;

export type PublicSiteEnv = Partial<Record<typeof PUBLIC_SITE_URL_ENV_KEY, string>>;

export function normalizeSiteUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getRequiredPublicSiteUrl(env: PublicSiteEnv) {
  const rawSiteUrl = env[PUBLIC_SITE_URL_ENV_KEY];

  if (!rawSiteUrl?.trim()) {
    throw new Error(`Missing ${PUBLIC_SITE_URL_ENV_KEY}`);
  }

  return normalizeSiteUrl(rawSiteUrl);
}

const siteMetadata = {
  title: "Luke Stephens",
  description:
    "Luke Stephens — software designer and persistent tinkerer sharing work, writing, and activity logs.",
  defaultOgImage: "/images/profile/luke2.jpg",
  openGraphLogo: "/faviconX167.svg",
  twitterSite: "@site",
  twitterCreator: "@lukey_stephens"
} as const;

export function createSiteConfig(env: PublicSiteEnv) {
  return {
    ...siteMetadata,
    url: getRequiredPublicSiteUrl(env)
  } as const;
}
