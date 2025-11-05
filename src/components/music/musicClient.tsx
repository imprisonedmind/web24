"use client";
import { FC, useEffect, useState, useCallback } from "react";
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
  initialSongData: songData | null;
}

export const MusicClient: FC<MusicClientProps> = ({ initialSongData }) => {
  const [songData, setSongData] = useState<songData | null>(
    initialSongData ?? null,
  );
  const [relativePlayed, setRelativePlayed] = useState<string | null>(null);
  const [recentRelative, setRecentRelative] = useState<string[]>([]);

  const fetchSongData = useCallback(async () => {
    const data = await getSongData();
    setSongData((prev) => {
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
  }, []);

  useEffect(() => {
    if (!initialSongData?.isPlaying) {
      void fetchSongData();
    }
  }, [fetchSongData, initialSongData?.isPlaying]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (!songData?.title) {
        timer = setTimeout(fetchSongData, 30_000);
        return;
      }

      if (
        songData.isPlaying &&
        typeof songData.durationMs === "number" &&
        typeof songData.progressMs === "number"
      ) {
        const remaining = Math.max(
          songData.durationMs - songData.progressMs,
          1_000,
        );
        const delay = Math.min(
          Math.max(remaining + 2_000, 10_000),
          10 * 60_000,
        );
        timer = setTimeout(fetchSongData, delay);
        return;
      }

      timer = setTimeout(fetchSongData, 45_000);
    };

    schedule();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    fetchSongData,
    songData?.title,
    songData?.isPlaying,
    songData?.durationMs,
    songData?.progressMs,
  ]);

  const hasTrack = Boolean(songData?.title);
  const isPlaying = Boolean(songData?.isPlaying);
  const headerTitle = isPlaying ? "listening" : "listened";
  const playbackStatus = isPlaying ? "playing" : "paused";

  const latestRecent = songData?.recentlyPlayed?.[0];
  const displayTitle = isPlaying
    ? (songData?.title ?? "")
    : (latestRecent?.title ?? songData?.title ?? "");
  const displayAlbum = isPlaying
    ? (songData?.album ?? "")
    : (latestRecent?.album ?? songData?.album ?? "");

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
        songData.recentlyPlayed!.map((item) =>
          item.playedAt
            ? `${formatDistanceToNowStrict(new Date(item.playedAt))} ago`
            : "",
        ),
      );
    };

    compute();
    const timer = setInterval(compute, 60_000);
    return () => clearInterval(timer);
  }, [songData?.recentlyPlayed]);

  if (!songData) return null;
  if (!hasTrack) return null;

  return (
    <div className={"flex w-full flex-col gap-1"}>
      <Header title={headerTitle} />

      <div
        className={
          "flex min-h-[32rem] w-full flex-col gap-2 rounded-xl bg-white p-2" +
          " shadow-sm sm:min-h-0"
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

        <div className="flex items-center justify-between text-sm text-neutral-800">
          <p className="max-w-[180px] truncate lowercase">{displayTitle}</p>
          <span className="max-w-[140px] truncate rounded-full bg-neutral-100 px-2 py-1 text-xs lowercase text-neutral-600">
            {displayAlbum}
          </span>
        </div>
      </div>
    </div>
  );
};
