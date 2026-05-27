import { getRequiredPublicSiteUrl, type PublicSiteEnv } from "@web24/config/site";

export type SiteUrlEnv = PublicSiteEnv;

export function getRequiredSiteUrl(env: SiteUrlEnv) {
  return getRequiredPublicSiteUrl(env);
}

export function getRequiredLocalSiteUrl() {
  return getRequiredPublicSiteUrl({ VITE_SITE_URL: process.env.VITE_SITE_URL });
}
