import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  musicQueryOptions,
  tvStatusQueryOptions,
  type SongData,
  type TvEntry,
} from "../lib/api";
import { withTmdbPosterSize } from "../lib/media-image";
import { CFImage } from "./cf-image";
import { SectionHeader, SmallLink } from "./legacy";
import { IPodContainer } from "./music-ipod-container";
import { IpodScreen } from "./music-ipod-screen";

function formatDistanceLabel(value?: string | null) {
  if (!value) return null;

  const diffMs = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getEpisodeCode(entry?: TvEntry | null) {
  if (!entry || entry.type !== "episode") return null;
  if (typeof entry.season === "number" && typeof entry.episode === "number") {
    return `${entry.season}x${entry.episode}`;
  }
  return null;
}

export function TvWidgetCard() {
  const {
    data: status = {
      currentlyWatching: null,
      lastWatched: null,
    },
  } = useQuery(tvStatusQueryOptions);

  const activeEntry = status.currentlyWatching ?? status.lastWatched;
  const label = status.currentlyWatching ? "watching" : "watched";
  const meta = status.currentlyWatching
    ? [
        getEpisodeCode(status.currentlyWatching),
        typeof status.currentlyWatching.progress === "number"
          ? `${Math.round(status.currentlyWatching.progress)}%`
          : null
      ]
        .filter(Boolean)
        .join(" • ")
    : formatDistanceLabel(status.lastWatched?.watchedAt);

  const title = activeEntry
    ? activeEntry.type === "episode"
      ? activeEntry.showTitle ?? activeEntry.title
      : activeEntry.title
    : "Nothing watched yet";

  if (!activeEntry) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <SectionHeader title={label} action={<SmallLink href="/watched" label="more" />} />
      <div className="flex min-h-[32rem] flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:min-h-0">
        <div className="relative h-full w-full overflow-hidden rounded-lg md:h-72">
          {activeEntry ? (
            <a href={activeEntry.url} target="_blank" rel="noreferrer" className="block h-full w-full">
              <CFImage
                src={withTmdbPosterSize(activeEntry.posterUrl, "w500")}
                alt={activeEntry.title}
                className="h-full w-full object-cover"
                unoptimized
              />
            </a>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500">
              Nothing watched yet
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium text-neutral-800">{title}</p>
          {meta ? (
            <div className="flex-shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
              {meta}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MusicWidgetCard() {
  const { data: currentSongData = null } = useQuery(musicQueryOptions);
  const [songData, setSongData] = useState<SongData | null>(currentSongData);
  const [relativePlayed, setRelativePlayed] = useState<string | null>(null);
  const [recentRelative, setRecentRelative] = useState<string[]>([]);

  useEffect(() => {
    setSongData(prev => {
      if (currentSongData?.title) {
        return currentSongData;
      }

      if (prev?.title) {
        return {
          ...prev,
          isPlaying: false,
          playedAt: currentSongData?.playedAt ?? prev.playedAt,
        };
      }

      return currentSongData ?? prev ?? null;
    });
  }, [currentSongData]);

  useEffect(() => {
    if (!songData?.title || !songData.playedAt || songData.isPlaying) {
      setRelativePlayed(null);
      return;
    }

    const update = () => {
      setRelativePlayed(formatDistanceLabel(songData.playedAt));
    };

    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, [songData?.title, songData?.playedAt, songData?.isPlaying]);

  useEffect(() => {
    if (!songData?.recentlyPlayed?.length) {
      setRecentRelative([]);
      return;
    }

    const update = () => {
      setRecentRelative(
        songData.recentlyPlayed!.map(item => formatDistanceLabel(item.playedAt) ?? "")
      );
    };

    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, [songData?.recentlyPlayed]);

  const headerTitle = songData?.isPlaying ? "listening" : "listened";
  const playbackStatus = songData?.isPlaying ? "playing" : "paused";
  const latestRecent = songData?.recentlyPlayed?.[0];
  const displayTitle = songData?.isPlaying
    ? songData.title
    : latestRecent?.title ?? songData?.title ?? "Nothing playing";
  const displayAlbum = songData?.isPlaying
    ? songData.album
    : latestRecent?.album ?? songData?.album ?? "spotify";

  return (
    <div className="flex w-full flex-col gap-1">
      <SectionHeader title={headerTitle} />
      <div className="flex min-h-[32rem] w-full flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:min-h-0">
        <IPodContainer status={playbackStatus}>
          <IpodScreen
            track={
              songData ?? {
                title: "",
                artist: "",
                album: "",
                albumImageUrl: "",
                songUrl: "#"
              }
            }
            isPlaying={Boolean(songData?.isPlaying)}
            relativePlayed={relativePlayed}
            recentlyPlayed={songData?.recentlyPlayed}
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
}
