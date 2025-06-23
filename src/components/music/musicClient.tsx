"use client";
import { FC, useEffect, useState } from "react";
import { Header } from "@/components/header";
import { songData } from "@/lib/types";
import ArmThingy from "@/components/music/armThingy";
import { VinylCircles } from "@/components/music/vinylCircles";
import { SongDescription } from "@/components/music/songDescription";
import { IPodContainer } from "@/components/music/ipodContainer";
import { SongLinkWrapper } from "@/components/music/songLinkWrapper";

const getSongData = async () => {
  const res = await fetch("/api/currentlyPlaying");
  return await res.json();
};

interface MusicClientProps {
  initialSongData: songData;
}

export const MusicClient: FC<MusicClientProps> = ({ initialSongData }) => {
  const [songData, setSongData] = useState<songData | null>(initialSongData);

  const fetchSongData = async () => {
    const data = await getSongData();
    setSongData(data);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSongData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!songData?.isPlaying) return null;

  return (
    <div className={"flex w-full flex-col gap-1"}>
      <Header title={"listening"} />


      <div
        className={
          "flex w-full flex-col gap-2 rounded-xl bg-white p-2 shadow-sm"
        }
      >
        <IPodContainer>
          <SongLinkWrapper
            songUrl={songData.songUrl}
            imgUrl={songData.albumImageUrl}
          >
            <ArmThingy />
            <VinylCircles albumImageUrl={songData.albumImageUrl} />
          </SongLinkWrapper>
        </IPodContainer>

        <SongDescription artist={songData.artist} title={songData.title} />
      </div>
    </div>
  );
};
