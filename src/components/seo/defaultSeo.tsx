"use client";

import { DefaultSeo } from "next-seo";

import { siteConfig } from "@/lib/siteConfig";

export function SeoDefaults() {
  return (
    <DefaultSeo
      title={siteConfig.title}
      description={siteConfig.description}
      canonical={siteConfig.url}
      openGraph={{
        url: siteConfig.url,
        title: siteConfig.title,
        description: siteConfig.description,
        siteName: siteConfig.title,
        images: [
          {
            url: `${siteConfig.url}/lukeOG.jpg`,
            width: 1024,
            height: 683,
            alt: siteConfig.title,
          },
          {
            url: `${siteConfig.url}${siteConfig.defaultOgImage}`,
            width: 1200,
            height: 630,
            alt: siteConfig.title,
          },
        ],
      }}
      twitter={{
        cardType: "summary_large_image",
        handle: siteConfig.twitterCreator,
        site: siteConfig.twitterSite,
      }}
      additionalMetaTags={[
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
      ]}
    />
  );
}
