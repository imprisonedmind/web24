import { useEffect, useState } from "react";

import { SectionHeader, SmallLink } from "./legacy";
import { IPodContainer } from "./music-ipod-container";
import { IpodScreen } from "./music-ipod-screen";

type TvEntry = {
  type: "movie" | "show" | "episode";
  title: string;
  showTitle?: string;
  episodeTitle?: string;
  season?: number;
  episode?: number;
  posterUrl: string;
  url: string;
  progress?: number;
  watchedAt?: string;
};

type TvStatus = {
  currentlyWatching: TvEntry | null;
  lastWatched: TvEntry | null;
};

type RecentlyPlayedTrack = {
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
  playedAt?: string;
  durationMs?: number;
};

type SongData = {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
  playedAt?: string;
  recentlyPlayed?: RecentlyPlayedTrack[];
  durationMs?: number;
  progressMs?: number;
};

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
  const [status, setStatus] = useState<TvStatus>({
    currentlyWatching: null,
    lastWatched: null
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/tv/status", { credentials: "include" });
        if (!response.ok) return;

        const payload = (await response.json()) as Partial<TvStatus>;
        if (!cancelled) {
          setStatus({
            currentlyWatching: payload.currentlyWatching ?? null,
            lastWatched: payload.lastWatched ?? null
          });
        }
      } catch (error) {
        console.error("[web/tv-widget] failed", error);
      }
    }

    void load();
    const interval = window.setInterval(load, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

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

  return (
    <div className="flex w-full flex-col gap-1">
      <SectionHeader title={label} action={<SmallLink href="/watched" label="more" />} />
      <div className="flex min-h-[32rem] flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:min-h-0">
        <div className="relative h-full w-full overflow-hidden rounded-lg md:h-72">
          {activeEntry ? (
            <a href={activeEntry.url} target="_blank" rel="noreferrer" className="block h-full w-full">
              <img
                src={activeEntry.posterUrl}
                alt={activeEntry.title}
                className="h-full w-full object-cover"
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
  const [songData, setSongData] = useState<SongData | null>(null);
  const [relativePlayed, setRelativePlayed] = useState<string | null>(null);
  const [recentRelative, setRecentRelative] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/currentlyPlaying");
        if (!response.ok) return;
        const payload = (await response.json()) as SongData | null;
        if (cancelled) return;

        setSongData(prev => {
          if (payload?.title) {
            return payload;
          }

          if (prev?.title) {
            return {
              ...prev,
              isPlaying: false,
              playedAt: payload?.playedAt ?? prev.playedAt
            };
          }

          return payload ?? prev ?? null;
        });
      } catch (error) {
        console.error("[web/music-widget] failed", error);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let timer: number | undefined;

    async function load() {
      try {
        const response = await fetch("/api/currentlyPlaying");
        if (!response.ok) return;
        const payload = (await response.json()) as SongData | null;
        setSongData(prev => {
          if (payload?.title) {
            return payload;
          }

          if (prev?.title) {
            return {
              ...prev,
              isPlaying: false,
              playedAt: payload?.playedAt ?? prev.playedAt
            };
          }

          return payload ?? prev ?? null;
        });
      } catch (error) {
        console.error("[web/music-widget] failed", error);
      }
    }

    if (
      songData?.isPlaying &&
      typeof songData.durationMs === "number" &&
      typeof songData.progressMs === "number"
    ) {
      const remaining = Math.max(songData.durationMs - songData.progressMs, 1_000);
      const delay = Math.min(Math.max(remaining + 2_000, 10_000), 10 * 60_000);
      timer = window.setTimeout(load, delay);
    } else {
      timer = window.setTimeout(load, songData?.title ? 45_000 : 30_000);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [songData?.title, songData?.isPlaying, songData?.durationMs, songData?.progressMs]);

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
