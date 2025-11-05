"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";

import { Header } from "@/components/header";
import type { CurrentlyWatching } from "@/app/activity/actions/getCurrentlyWatching";
import type { LastWatched } from "@/app/activity/actions/getLastWatched";

type TvStatus = {
  currentlyWatching: CurrentlyWatching | null;
  lastWatched: LastWatched | null;
};

type TvWidgetClientProps = {
  initialCurrentlyWatching: CurrentlyWatching | null;
  initialLastWatched: LastWatched | null;
};

async function fetchTvStatus(): Promise<TvStatus | null> {
  try {
    const res = await fetch("/api/tv/status", {
      cache: "no-store",
      credentials: "include"
    });
    if (!res.ok) {
      console.error("[tv/status] request failed", res.status, res.statusText);
      return null;
    }
    const data = (await res.json()) as Partial<TvStatus> | null;
    if (!data) return { currentlyWatching: null, lastWatched: null };

    return {
      currentlyWatching: data.currentlyWatching ?? null,
      lastWatched: data.lastWatched ?? null
    };
  } catch (error) {
    console.error("[tv/status] fetch threw", error);
    return null;
  }
}

function getEpisodeCode(status: TvStatus["currentlyWatching"] | TvStatus["lastWatched"]) {
  if (!status || status.type !== "episode") return null;

  const season =
    typeof status.season === "number" ? status.season : undefined;
  const episode =
    typeof status.episode === "number" ? status.episode : undefined;

  if (season !== undefined && episode !== undefined) {
    return `${season}x${episode}`;
  }
  if (season !== undefined) return `${season}x?`;
  if (episode !== undefined) return `?x${episode}`;

  return null;
}

function getDisplayText(
  entry: TvStatus["currentlyWatching"] | TvStatus["lastWatched"],
  includeEpisodeCode: boolean
) {
  if (!entry) return "Nothing watched yet";

  if (entry.type === "episode") {
    const title = entry.showTitle ?? entry.title ?? "Untitled";
    if (!includeEpisodeCode) return title;

    const code = getEpisodeCode(entry);
    return code ? `${code} | ${title}` : title;
  }

  return entry.title ?? entry.showTitle ?? entry.episodeTitle ?? "Untitled";
}

function computeNextPollDelay(status: TvStatus) {
  const MIN_DELAY = 10_000;
  const MAX_DELAY = 5 * 60_000;

  const live = status.currentlyWatching;
  if (live) {
    if (live.expiresAt) {
      const expires = new Date(live.expiresAt).getTime();
      if (Number.isFinite(expires)) {
        const remaining = Math.max(expires - Date.now(), MIN_DELAY);
        return Math.min(remaining, MAX_DELAY);
      }
    }

    return 30_000;
  }

  return 45_000;
}

export function TvWidgetClient({
  initialCurrentlyWatching,
  initialLastWatched
}: TvWidgetClientProps) {
  const [status, setStatus] = useState<TvStatus>({
    currentlyWatching: initialCurrentlyWatching,
    lastWatched: initialLastWatched
  });
  const statusRef = useRef<TvStatus>(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const poll = useCallback(async () => {
    const data = await fetchTvStatus();
    if (data) {
      statusRef.current = data;
      setStatus(data);
      return data;
    }

    statusRef.current = {
      currentlyWatching: null,
      lastWatched: statusRef.current.lastWatched
    };
    setStatus(statusRef.current);
    return null;
  }, []);

  useEffect(() => {
    if (!initialCurrentlyWatching) {
      void poll();
    }
  }, [initialCurrentlyWatching, poll]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      if (cancelled) return;
      const delay = computeNextPollDelay(statusRef.current);
      timer = setTimeout(async () => {
        await poll();
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [poll]);

  const activeEntry = status.currentlyWatching ?? status.lastWatched ?? null;
  const infoText = getDisplayText(
    activeEntry,
    !status.currentlyWatching && activeEntry?.type === "episode"
  );

  const episodeCode = getEpisodeCode(
    status.currentlyWatching ?? status.lastWatched
  );

  const metaLabel = status.currentlyWatching
    ? [
        status.currentlyWatching.type === "episode" ? episodeCode : null,
        typeof status.currentlyWatching.progress === "number"
          ? `${Math.round(status.currentlyWatching.progress)}%`
          : null
      ]
        .filter(Boolean)
        .join(" • ")
    : status.lastWatched
      ? `${formatDistanceToNowStrict(new Date(status.lastWatched.watchedAt))} ago`
      : null;

  return (
    <div className="flex w-full flex-col gap-1">
      <Header
        title={status.currentlyWatching ? "watching" : "watched"}
        seeAll
        link="/watched"
      />

      <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm">
        <div className="relative h-72 w-full overflow-hidden rounded-lg">
          {activeEntry ? (
            <a
              href={activeEntry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full"
            >
              <Image
                src={activeEntry.posterUrl}
                alt={activeEntry.title}
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
            </a>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500">
              Nothing watched yet
            </div>
          )}
        </div>

        {activeEntry ? (
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-medium text-neutral-800">
              {infoText}
            </p>

            {metaLabel ? (
              <div className="flex-shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                {metaLabel}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-neutral-800">Nothing watched yet</p>
        )}
      </div>
    </div>
  );
}
