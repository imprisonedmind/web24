import { useEffect, useMemo, useState } from "react";

import { SectionHeader, SmallLink } from "./legacy";

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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/currentlyPlaying");
        if (!response.ok) return;
        const payload = (await response.json()) as SongData | null;
        if (!cancelled) setSongData(payload);
      } catch (error) {
        console.error("[web/music-widget] failed", error);
      }
    }

    void load();
    const interval = window.setInterval(load, 45_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!songData?.playedAt || songData.isPlaying) {
      setRelativePlayed(null);
      return;
    }

    const update = () => {
      setRelativePlayed(formatDistanceLabel(songData.playedAt));
    };

    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, [songData?.playedAt, songData?.isPlaying]);

  const headerTitle = songData?.isPlaying ? "listening" : "listened";
  const latestRecent = songData?.recentlyPlayed?.[0];
  const displayTitle = songData?.isPlaying
    ? songData.title
    : latestRecent?.title ?? songData?.title ?? "Nothing playing";
  const displayAlbum = songData?.isPlaying
    ? songData.album
    : latestRecent?.album ?? songData?.album ?? "spotify";

  const playlist = useMemo(() => (songData?.recentlyPlayed ?? []).slice(0, 5), [songData]);

  return (
    <div className="flex w-full flex-col gap-1">
      <SectionHeader title={headerTitle} />
      <div className="flex min-h-[32rem] w-full flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:min-h-0">
        <div className="relative grow rounded-lg">
          <div className="relative h-full w-auto overflow-hidden rounded-xl border border-gray-400 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 shadow-2xl md:h-72">
            <div className="absolute left-4 right-4 top-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute left-2 right-2 top-2 h-64 overflow-hidden rounded-lg border-2 border-gray-700 bg-neutral-300 md:h-32">
              <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-gradient-to-b from-neutral-50 via-neutral-50 to-neutral-50/0 shadow-inner">
                <div className="flex items-center justify-between border-b bg-neutral-50 px-1">
                  <span className="text-[7px] text-black">
                    {songData?.isPlaying ? "Now Playing" : "Songs"}
                  </span>
                  <span className="flex items-center gap-1 text-[9px]">
                    <span className="text-[10px] text-blue-500">
                      {songData?.isPlaying ? "▶︎" : "♪"}
                    </span>
                    <span className="relative flex h-2 w-5 items-center justify-end rounded-sm border border-green-500">
                      <span className="mr-[1px] h-[70%] w-3 rounded-sm bg-green-500" />
                    </span>
                  </span>
                </div>

                {songData?.isPlaying ? (
                  <a
                    href={songData.songUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 flex-col items-center justify-between gap-3 p-2 pb-1"
                  >
                    <div className="flex w-full grow gap-2">
                      <div className="relative aspect-square h-full w-auto flex-shrink-0 overflow-hidden rounded-sm border border-neutral-700 bg-neutral-800">
                        <img
                          src={songData.albumImageUrl || "/fallback-poster.jpg"}
                          alt={songData.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="my-auto flex flex-col gap-1 text-left leading-tight">
                        <p className="text-[10px] font-semibold text-black">{songData.title}</p>
                        <div>
                          <p className="overflow-ellipsis text-[9px] text-neutral-600">
                            {songData.artist}
                          </p>
                          <p className="overflow-ellipsis text-[8px] text-neutral-500">
                            {songData.album}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full max-w-[180px] flex-shrink-0 space-y-1 text-left text-[9px] text-neutral-400">
                      <div className="h-[3px] w-full overflow-hidden rounded-full bg-neutral-300">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${
                              songData.durationMs && songData.progressMs
                                ? Math.min(songData.progressMs / songData.durationMs, 1) * 100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                      {songData.durationMs ? (
                        <div className="flex items-center justify-between">
                          <span>{formatClock(songData.progressMs ?? 0)}</span>
                          <span>{formatClock(songData.durationMs)}</span>
                        </div>
                      ) : null}
                    </div>
                    {relativePlayed && !songData.durationMs ? (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                        {relativePlayed}
                      </span>
                    ) : null}
                  </a>
                ) : (
                  <div className="flex flex-1 flex-col pb-2">
                    {playlist.length ? (
                      playlist.map((item, index) => (
                        <a
                          key={`${item.title}-${item.playedAt ?? index}`}
                          href={item.songUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center justify-between px-1 py-1 text-[10px] transition ${
                            index === 0
                              ? "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 text-white"
                              : "hover:bg-neutral-500/30"
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 flex-col leading-tight">
                            <span className={`truncate font-semibold ${index === 0 ? "text-white" : "text-neutral-500"}`}>
                              {item.title}
                            </span>
                          </div>
                          <span className={`pl-2 text-[12px] ${index === 0 ? "text-white" : "text-neutral-500"}`}>
                            ❯
                          </span>
                        </a>
                      ))
                    ) : (
                      <div className="flex flex-1 items-center justify-center px-6 text-center text-[11px] text-neutral-400">
                        <p>No recent listens found.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 scale-[0.8] transform">
              <div className="relative h-36 w-36 rounded-full border border-gray-300 bg-gradient-to-b from-white via-gray-50 to-gray-200 shadow-lg">
                <div className="absolute inset-1 rounded-full border border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100">
                  <div className="absolute left-1/2 top-3 -translate-x-1/2 transform text-[10px] font-medium tracking-wide text-gray-600">
                    MENU
                  </div>
                </div>
                <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 transform rounded-full border border-gray-300 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 shadow-inner" />
              </div>
            </div>
            <div className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-gradient-to-r from-transparent via-black/20 to-transparent" />
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 via-transparent to-transparent" />
        </div>

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

function formatClock(ms: number) {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
