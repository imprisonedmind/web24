import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  musicQueryOptions,
  readingStatusQueryOptions,
  tvStatusQueryOptions,
  gamingStatusQueryOptions,
  type ReadingStatus,
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

function formatGamingDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

export function GamingWidgetCard() {
  const { data: status } = useQuery(gamingStatusQueryOptions);
  const game = status?.currentGame ?? status?.lastSession;
  if (!game) return null;
  const isPlaying = Boolean(status?.currentGame);
  const meta = isPlaying
    ? formatGamingDuration((Date.now() - game.startedAtMs) / 1000)
    : formatDistanceLabel(new Date(status!.lastSession!.endedAtMs).toISOString());

  return (
    <div className="flex w-full flex-col gap-1">
      <SectionHeader title={isPlaying ? "playing" : "played"} action={<SmallLink href="/activity" label="more" ariaLabel="More gaming activity" />} />
      <div className="flex min-h-[32rem] flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:min-h-0">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-neutral-100 text-neutral-600 md:h-72 md:flex-none">
          {game.coverUrl ? (
            <img src={game.coverUrl} alt={game.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-72 flex-col items-center justify-center gap-5 p-8 text-center">
              <p className="line-clamp-3 text-2xl font-semibold leading-tight">{game.title}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium text-neutral-800">{game.title}</p>
          <div className="flex-shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700">{meta}</div>
        </div>
      </div>
    </div>
  );
}

function parseTime(value?: string | number | null) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function HomeWidgetGrid() {
  const { data: tv } = useQuery(tvStatusQueryOptions);
  const { data: reading } = useQuery(readingStatusQueryOptions);
  const { data: music } = useQuery(musicQueryOptions);
  const { data: gaming } = useQuery(gamingStatusQueryOptions);

  const candidates = [
    {
      key: "tv",
      available: Boolean(tv?.currentlyWatching ?? tv?.lastWatched),
      timestamp: tv?.currentlyWatching ? Date.now() : parseTime(tv?.lastWatched?.watchedAt),
      element: <TvWidgetCard />,
    },
    {
      key: "reading",
      available: Boolean(reading),
      timestamp: parseTime(reading?.lastReadDate),
      element: <ReadingWidgetCard />,
    },
    {
      key: "music",
      available: Boolean(music?.title),
      timestamp: music?.isPlaying ? Date.now() : parseTime(music?.recentlyPlayed?.[0]?.playedAt ?? music?.playedAt),
      element: <MusicWidgetCard />,
    },
    {
      key: "gaming",
      available: Boolean(gaming?.currentGame ?? gaming?.lastSession),
      timestamp: gaming?.currentGame?.heartbeatAtMs ?? gaming?.lastSession?.endedAtMs ?? 0,
      element: <GamingWidgetCard />,
    },
  ];
  const visible = candidates
    .filter(item => item.available)
    .sort((left, right) => right.timestamp - left.timestamp);

  return (
    <section className="flex gap-4 overflow-x-scroll pb-4">
      {visible.map(item => (
        <div key={item.key} className="w-[min(85vw,26rem)] flex-none sm:w-[22rem] lg:w-[calc((100%-2rem)/3)]">
          {item.element}
        </div>
      ))}
    </section>
  );
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
      <SectionHeader
        title={label}
        action={<SmallLink href="/watched" label="more" ariaLabel="More watched" srSuffix=" watched" />}
      />
      <div className="flex min-h-[32rem] flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:min-h-0">
        <div className="relative h-full w-full overflow-hidden rounded-lg md:h-72">
          {activeEntry ? (
            <a href={activeEntry.url} target="_blank" rel="noreferrer" className="block h-full w-full">
              <CFImage
                src={withTmdbPosterSize(activeEntry.posterUrl, "w342")}
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

function fallbackBookCover(title: string, author?: string) {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-[#db2777] p-5 text-white">
      <div className="h-1 w-10 rounded-full bg-white/70" />
      <div className="flex flex-col gap-2">
        <p className="line-clamp-4 text-lg font-semibold leading-tight">{title}</p>
        {author ? <p className="line-clamp-2 text-sm text-white/80">{author}</p> : null}
      </div>
      <div className="h-1 w-16 rounded-full bg-white/70" />
    </div>
  );
}

export function ReadingWidgetCard() {
  const { data: status = null } = useQuery(readingStatusQueryOptions);
  const book = status as ReadingStatus | null;

  if (!book) {
    return null;
  }

  const meta =
    book.status === "in_progress"
      ? `${Math.round(book.progressPercent)}%`
      : formatDistanceLabel(book.lastReadDate);

  return (
    <div className="flex w-full flex-col gap-1">
      <SectionHeader
        title="read"
        action={<SmallLink href="/read" label="more" ariaLabel="More read" srSuffix=" read" />}
      />
      <div className="flex min-h-[32rem] flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:min-h-0">
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-neutral-100 md:h-72">
          {book.coverUrl ? (
            <a
              href={`https://openlibrary.org/search?q=${encodeURIComponent(`${book.title} ${book.author ?? ""}`)}`}
              target="_blank"
              rel="noreferrer"
              className="block h-full w-full"
            >
              <CFImage
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover"
                unoptimized
              />
            </a>
          ) : (
            fallbackBookCover(book.title, book.author)
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium lowercase text-neutral-800">{book.title}</p>
          {meta ? (
            <div className="flex-shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-xs lowercase text-neutral-700">
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
        <div className="h-[29rem] min-h-0 md:h-72">
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
