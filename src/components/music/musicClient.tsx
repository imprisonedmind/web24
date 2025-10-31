"use client";
import { FC, useEffect, useState } from "react";
import { Header } from "@/components/header";
import { type songData } from "@/lib/types";
import { IPodContainer } from "@/components/music/ipodContainer";
import { formatDistanceToNowStrict } from "date-fns";
import IpodScreen from "@/components/music/ipodScreen";

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
  const [recentRelative, setRecentRelative] = useState<string[]>([]);

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

  useEffect(() => {
    if (!songData?.recentlyPlayed?.length) {
      setRecentRelative([]);
      return;
    }

    const compute = () => {
      setRecentRelative(
        songData.recentlyPlayed!.map(item =>
          item.playedAt
            ? `${formatDistanceToNowStrict(new Date(item.playedAt))} ago`
            : ""
        )
      );
    };

    compute();
    const timer = setInterval(compute, 60_000);
    return () => clearInterval(timer);
  }, [songData?.recentlyPlayed]);

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
          <IpodScreen
            track={songData}
            isPlaying={isPlaying}
            relativePlayed={relativePlayed}
            recentlyPlayed={songData.recentlyPlayed}
            recentRelative={recentRelative}
          />
        </IPodContainer>
      </div>
    </div>
  );
};
