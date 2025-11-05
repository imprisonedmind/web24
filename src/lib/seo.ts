import { Metadata } from "next";
import { NextSeoProps } from "next-seo";
import { siteConfig } from "@/lib/siteConfig";

type SEOImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export type CreateMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  images?: Array<string | { url: string; width?: number; height?: number; alt?: string }>;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
};

function absoluteUrl(path?: string) {
  if (!path) return siteConfig.url;
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${normalized}`;
}

function normalizeImages(images?: CreateMetadataOptions["images"]): SEOImage[] {
  if (!images?.length) {
    return [
      {
        url: absoluteUrl(siteConfig.defaultOgImage),
        width: 1200,
        height: 630,
        alt: siteConfig.title
      }
    ];
  }

  return images.map(image =>
    typeof image === "string"
      ? { url: absoluteUrl(image) }
      : {
          ...image,
          url: absoluteUrl(image.url)
        }
  );
}

export function createMetadata(options: CreateMetadataOptions): Metadata {
  const {
    title,
    description,
    path,
    images,
    type = "website",
    publishedTime,
    modifiedTime
  } = options;
  const url = absoluteUrl(path);
  const ogImages = normalizeImages(images);
  const twitterImages = ogImages.map(image => image.url);

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      type,
      title,
      description,
      url,
      siteName: siteConfig.title,
      images: ogImages,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {})
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterSite,
      creator: siteConfig.twitterCreator,
      title,
      description,
      images: twitterImages
    }
  };
}

export function createSeoProps(options: CreateMetadataOptions): NextSeoProps {
  const {
    title,
    description,
    path,
    images,
    type = "website",
    publishedTime,
    modifiedTime
  } = options;

  const url = absoluteUrl(path);
  const ogImages = normalizeImages(images);
  const twitterImages = ogImages.map(image => image.url);

  return {
    title,
    description,
    canonical: url,
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: siteConfig.title,
      images: ogImages,
      ...(publishedTime ? { article: { publishedTime, modifiedTime } } : {}),
      ...(modifiedTime && !publishedTime ? { article: { modifiedTime } } : {})
    },
    twitter: {
      cardType: "summary_large_image",
      site: siteConfig.twitterSite,
      handle: siteConfig.twitterCreator
    }
  };
}
