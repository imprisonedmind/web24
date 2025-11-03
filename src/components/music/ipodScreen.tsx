"use client";

import Image from "next/image";
import Link from "next/link";
import type { RecentlyPlayedTrack, songData } from "@/lib/types";
import { memo, useEffect, useState } from "react";

type TrackSummary = Pick<
  songData,
  | "title"
  | "artist"
  | "album"
  | "albumImageUrl"
  | "songUrl"
  | "playedAt"
  | "progressMs"
  | "durationMs"
>;

interface IpodScreenProps {
  isPlaying: boolean;
  track: TrackSummary;
  relativePlayed: string | null;
  recentlyPlayed?: RecentlyPlayedTrack[];
  recentRelative?: string[];
}

const FALLBACK_ART = "/fallback-poster.jpg";

function IpodScreenComponent({
  isPlaying,
  track,
  relativePlayed,
  recentlyPlayed,
  recentRelative,
}: IpodScreenProps) {
  const headerLabel = isPlaying ? "Now Playing" : "Songs";
  const playlist = (recentlyPlayed ?? []).slice(0, 5);
  const baseProgress = track.progressMs ?? 0;
  const durationMs = track.durationMs ?? 0;
  const [progress, setProgress] = useState(baseProgress);

  useEffect(() => {
    setProgress(baseProgress);
    if (!isPlaying || !durationMs) return;

    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      setProgress((prev) => {
        const next = baseProgress + elapsed;
        if (next >= durationMs) return durationMs;
        return next;
      });
    };

    tick();
    const timer = setInterval(tick, 1_000);
    return () => clearInterval(timer);
  }, [isPlaying, durationMs, baseProgress]);

  const progressPercent = durationMs
    ? Math.min(progress / durationMs, 1) * 100
    : 0;

  return (
    <div
      className={`
        flex h-full w-full flex-col overflow-hidden rounded-md
        bg-gradient-to-b from-neutral-50 via-neutral-50 to-neutral-50/0
        text-white shadow-inner
      `}
    >
      <div
        className={`flex items-center justify-between border-b bg-neutral-50 px-1`}
      >
        <span className={"text-[7px] text-black"}>{headerLabel}</span>

        <span className="flex items-center gap-1 text-[9px]">
          {isPlaying ? (
            <span className="text-[10px] text-blue-500">▶︎</span>
          ) : (
            <span className="text-[10px]">♪</span>
          )}
          <span className="relative flex h-2 w-5 items-center justify-end rounded-sm border border-green-500">
            <span className="mr-[1px] h-[70%] w-3 rounded-sm bg-green-500" />
          </span>
        </span>
      </div>

      {isPlaying ? (
        <Link
          href={track.songUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 flex-col items-center justify-between gap-3 p-2 pb-1"
        >
          <div className={"flex-start flex w-full grow gap-2"}>
            <div className="relative aspect-square h-full w-auto flex-shrink-0 overflow-hidden rounded-sm border border-neutral-700 bg-neutral-800">
              <Image
                src={track.albumImageUrl || FALLBACK_ART}
                alt={track.title}
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            </div>

            <div className="my-auto flex flex-col gap-1 text-left leading-tight">
              <p className="text-[10px] font-semibold text-black">
                {track.title}
              </p>

              <div>
                <p className="overflow-ellipsis text-[9px] text-neutral-600">
                  {track.artist}
                </p>
                <p className="overflow-ellipsis text-[8px] text-neutral-500">
                  {track.album}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[180px] flex-shrink-0 space-y-1 text-left text-[9px] text-neutral-400">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-neutral-300">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {durationMs ? (
              <div className="flex items-center justify-between">
                <span>{formatClock(progress)}</span>
                <span>{formatClock(durationMs)}</span>
              </div>
            ) : null}
          </div>
          {relativePlayed && !durationMs && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              {relativePlayed}
            </span>
          )}
        </Link>
      ) : (
        <div className="flex flex-1 flex-col pb-2">
          {playlist.length ? (
            playlist.map((item, index) => {
              const href = item.songUrl || "#";
              const relative = recentRelative?.[index] ?? "";
              const isActive = index === 0;
              return (
                <Link
                  key={`${item.title}-${item.playedAt ?? index}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex items-center justify-between px-1 py-1 text-[10px] transition
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 text-white"
                        : "hover:bg-neutral-500/30"
                    }
                  `}
                >
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span
                      className={`truncate font-semibold ${isActive ? "text-white" : "text-neutral-500"}`}
                    >
                      {item.title}
                    </span>
                  </div>

                  <span
                    className={`pl-2 text-[12px] ${isActive ? "text-white" : "text-neutral-500"}`}
                  >
                    ❯
                  </span>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-[11px] text-neutral-400">
              <p>No recent listens found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const IpodScreen = memo(IpodScreenComponent);

export default IpodScreen;

function formatClock(ms: number) {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
