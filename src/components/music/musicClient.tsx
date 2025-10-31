"use client";
import { FC, useEffect, useState } from "react";
import { Header } from "@/components/header";
import { songData } from "@/lib/types";
import ArmThingy from "@/components/music/armThingy";
import { VinylCircles } from "@/components/music/vinylCircles";
import { SongDescription } from "@/components/music/songDescription";
import { IPodContainer } from "@/components/music/ipodContainer";
import { SongLinkWrapper } from "@/components/music/songLinkWrapper";
import { formatDistanceToNowStrict } from "date-fns";

const getSongData = async () => {
  const res = await fetch("/api/currentlyPlaying");
  return await res.json();
};

interface MusicClientProps {
  initialSongData: songData;
}

export const MusicClient: FC<MusicClientProps> = ({ initialSongData }) => {
  const [songData, setSongData] = useState<songData | null>(
    initialSongData ?? null
  );
  const [relativePlayed, setRelativePlayed] = useState<string | null>(null);

  const fetchSongData = async () => {
    const data = await getSongData();
    setSongData(prev => {
      if (data?.title) {
        return data;
      }
      if (prev?.title) {
        const updated = {
          ...prev,
          isPlaying: false,
          playedAt: data?.playedAt ?? prev.playedAt,
        };
        return updated;
      }
      return data ?? prev ?? null;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSongData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const hasTrack = Boolean(songData?.title);
  const isPlaying = Boolean(songData?.isPlaying);
  const headerTitle = isPlaying ? "listening" : "listened";
  const playbackStatus = isPlaying ? "playing" : "paused";

  const songUrl = songData?.songUrl || "#";
  const playedAt = songData?.playedAt ?? null;

  useEffect(() => {
    if (!hasTrack || !playedAt || isPlaying) {
      setRelativePlayed(null);
      return;
    }

    const compute = () => {
      setRelativePlayed(`${formatDistanceToNowStrict(new Date(playedAt))} ago`);
    };

    compute();
    const timer = setInterval(compute, 60_000);
    return () => clearInterval(timer);
  }, [hasTrack, isPlaying, playedAt]);

  if (!hasTrack) return null;

  return (
    <div className={"flex w-full flex-col gap-1"}>
      <Header title={headerTitle} />


      <div
        className={
          "flex w-full flex-col gap-2 rounded-xl bg-white p-2 shadow-sm"
        }
      >
        <IPodContainer status={playbackStatus}>
          <SongLinkWrapper
            songUrl={songUrl}
            imgUrl={songData.albumImageUrl}
          >
            <ArmThingy isPlaying={isPlaying} />
            <VinylCircles
              albumImageUrl={songData.albumImageUrl}
              isPlaying={isPlaying}
            />
          </SongLinkWrapper>
        </IPodContainer>

        <SongDescription
          artist={songData.artist}
          album={songData.album}
          title={songData.title}
          listenedAgo={relativePlayed}
        />
      </div>
    </div>
  );
};
