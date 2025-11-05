import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// core styles shared by all of react-notion-x (required)
import "react-notion-x/src/styles.css";

// used for code syntax highlighting (optional)
import "prismjs/themes/prism-tomorrow.css";

// used for rendering equations (optional)
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/siteConfig";
import { SeoDefaults } from "@/components/seo/defaultSeo";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/faviconX167.svg" sizes="any" />
      </head>

      <body className={cn(inter.className, "bg-neutral-50")}>
        <SeoDefaults />
        <div id={"modal"} />
        {children}
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: siteConfig.title,
  metadataBase: new URL(siteConfig.url),
  description: siteConfig.description,
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.title,
    images: [
      {
        url: `${siteConfig.url}/lukeOG.jpg`,
        width: 1024,
        height: 683,
        alt: siteConfig.title
      },
      {
        url: `${siteConfig.url}${siteConfig.defaultOgImage}`,
        width: 1200,
        height: 630,
        alt: siteConfig.title
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterSite,
    creator: siteConfig.twitterCreator,
    images: [`${siteConfig.url}${siteConfig.defaultOgImage}`]
  }
};
