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
    if (typeof window !== "undefined") {
      const videos = document.querySelectorAll("video");

      videos.forEach((video) => {
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.play();
      });
    }
  }, []);

  return (
    <NotionRenderer
      className={"[v"}
      recordMap={recordMap}
      darkMode={false}
      fullPage={false}
      components={{ Code, Collection }}
    />
  );
};
