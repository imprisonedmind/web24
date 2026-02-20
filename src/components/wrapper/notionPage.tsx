"use client";
import * as React from "react";
import { FC, useEffect } from "react";
import { NotionRenderer } from "react-notion-x";
import "react-notion-x/src/styles.css";
import { ExtendedRecordMap } from "notion-types";
import dynamic from "next/dynamic";
// import { Collection } from 'react-notion-x/build/third-party/collection'

const Code = dynamic(() =>
  import("react-notion-x/build/third-party/code").then((m) => m.Code),
);
const Collection = dynamic(() =>
  import("react-notion-x/build/third-party/collection").then(
    (m) => m.Collection,
  ),
);

interface NotionPageProps {
  recordMap: ExtendedRecordMap;
}

export const NotionPage: FC<NotionPageProps> = (props) => {
  const { recordMap } = props;

  useEffect(() => {
    const containers = document.querySelectorAll<HTMLElement>(
      ".notion-asset-wrapper-video > div"
    );
    const videos = document.querySelectorAll<HTMLVideoElement>(".notion video");

    containers.forEach((container) => {
      container.style.setProperty("height", "100%", "important");
      container.style.setProperty("min-height", "0", "important");
      container.style.setProperty("padding-bottom", "0", "important");
    });

    videos.forEach((video) => {
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      void video.play().catch(() => {
        // Ignore blocked/unsupported autoplay attempts.
      });
    });
  }, [recordMap]);

  return (
    <NotionRenderer
      recordMap={recordMap}
      darkMode={false}
      fullPage={false}
      components={{ Code, Collection }}
      bodyClassName={"!px-0"}
    />
  );
};
