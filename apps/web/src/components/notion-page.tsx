import { useEffect } from "react";
import { NotionRenderer } from "react-notion-x";
import type { ExtendedRecordMap } from "notion-types";
import { Code } from "react-notion-x/build/third-party/code";
import { Collection } from "react-notion-x/build/third-party/collection";

import "react-notion-x/src/styles.css";
import "prismjs/themes/prism-tomorrow.css";
import "katex/dist/katex.min.css";

export function NotionPage({ recordMap }: { recordMap: ExtendedRecordMap }) {
  useEffect(() => {
    const containers = document.querySelectorAll<HTMLElement>(
      ".notion-asset-wrapper-video > div"
    );
    const videos = document.querySelectorAll<HTMLVideoElement>(".notion video");

    containers.forEach(container => {
      container.style.setProperty("height", "100%", "important");
      container.style.setProperty("min-height", "0", "important");
      container.style.setProperty("padding-bottom", "0", "important");
    });

    videos.forEach(video => {
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      void video.play().catch(() => {});
    });
  }, [recordMap]);

  return (
    <NotionRenderer
      recordMap={recordMap}
      darkMode={false}
      fullPage={false}
      components={{ Code, Collection }}
      bodyClassName="!px-0"
    />
  );
}
