import querystring from "querystring";

export function spaceToHyphen(str) {
  return str?.replace(/\s+/g, "-").toLowerCase();
}


//SPOTIFY DATA FETCHING
const {
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_CLIENT_SECRET: client_secret,
  SPOTIFY_REFRESH_TOKEN: refresh_token,
} = process.env;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const recentlyPlayedEndpoint = (limit = 50, params) => {
  const boundedLimit = Math.min(Math.max(limit, 1), 50);
  const url = new URL("https://api.spotify.com/v1/me/player/recently-played");
  url.searchParams.set("limit", String(boundedLimit));

  if (typeof params === "string") {
    if (params) url.searchParams.set("after", params);
  } else if (params && typeof params === "object") {
    const { after, before } = params;
    if (after) url.searchParams.set("after", after);
    if (before) url.searchParams.set("before", before);
  }

  return url.toString();
};
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    cache: "no-cache",
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: querystring.stringify({
      grant_type: "refresh_token",
      refresh_token,
    }),
  });

  return response.json();
};

export const getNowPlaying = async () => {
  const { access_token } = await getAccessToken();

  return fetch(NOW_PLAYING_ENDPOINT, {
    cache: "no-cache",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

const getRecentlyPlayed = async (limit = 50, params) => {
  const { access_token } = await getAccessToken();

  return fetch(recentlyPlayedEndpoint(limit, params), {
    cache: "no-cache",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

const mapTrackResponse = (track, extras = {}) => {
  if (!track) return null;

  const title = track.name || "unknown";
  const artist =
    track.artists?.map((_artist) => _artist.name).join(", ") || "unknown";
  const album = track.album?.name || "";
  const albumImageUrl = track.album?.images?.[0]?.url || "";
  const songUrl = track.external_urls?.spotify || "#";
  const durationMs = track.duration_ms;

  return {
    album,
    albumImageUrl,
    artist,
    songUrl,
    title,
    ...extras,
    isPlaying: Boolean(extras.isPlaying),
    durationMs,
  };
};

export const returnSongData = async (requireTrack = false) => {
  let recentTracks = [];

  try {
    const recentRes = await getRecentlyPlayed(6);
    if (!recentRes.ok) {
      console.warn(
        `[spotify] recently played request failed (${recentRes.status})`,
      );
    } else {
      const recent = await recentRes.json();
      recentTracks = (recent?.items ?? [])
        .map((item) =>
          mapTrackResponse(item?.track, {
            playedAt: item?.played_at,
            source: "recently_played",
          }),
        )
        .filter(Boolean);
      if (recentTracks.length) {
        console.log(
          `[spotify] fetched ${recentTracks.length} recently played tracks`,
        );
      } else {
        console.warn(
          "[spotify] recently played payload missing track information",
        );
      }
    }
  } catch (error) {
    console.error("[spotify] error fetching recently played", error);
  }

  try {
    const response = await getNowPlaying();
    if (response.status === 200) {
      const song = await response.json();

      if (
        song?.is_playing &&
        song?.currently_playing_type === "track" &&
        song?.item
      ) {
        const playing = mapTrackResponse(song.item, {
          isPlaying: true,
          source: "currently_playing",
          progressMs: song.progress_ms ?? 0,
        });
        if (playing?.title) {
          console.log(`[spotify] currently playing track: ${playing.title}`);
          return {
            ...playing,
            recentlyPlayed: recentTracks,
          };
        }
      } else {
        console.log(
          "[spotify] no active track returned from currently playing endpoint",
        );
      }
    } else if (response.status !== 204) {
      console.warn(
        `[spotify] currently playing request failed (${response.status})`,
      );
    }
  } catch (error) {
    console.error("[spotify] error fetching currently playing track", error);
  }

  if (recentTracks.length) {
    const [latest, ...rest] = recentTracks;
    return {
      ...latest,
      isPlaying: false,
      recentlyPlayed: [latest, ...rest],
    };
  }

  if (!requireTrack) {
    return { isPlaying: false, recentlyPlayed: recentTracks };
  }

  console.warn("[spotify] no track data available from Spotify");
  return null;
};

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

const parseDay = (value) => {
  if (typeof value !== "string") return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function getSpotifyRecentDays(rangeArg = 50) {
  const todayUtc = new Date();
  let rangeEnd = new Date(
    Date.UTC(
      todayUtc.getUTCFullYear(),
      todayUtc.getUTCMonth(),
      todayUtc.getUTCDate(),
    ),
  );
  let rangeStart = null;
  let targetDays = null;
  let maxDaysCap = 365;

  if (rangeArg && typeof rangeArg === "object" && typeof rangeArg.maxDays === "number") {
    maxDaysCap = Math.max(1, Math.floor(rangeArg.maxDays));
  }

  const clampDays = (value) =>
    Math.max(1, Math.min(Math.floor(value), maxDaysCap));

  if (typeof rangeArg === "number") {
    targetDays = clampDays(rangeArg);
  } else if (rangeArg && typeof rangeArg === "object") {
    if (rangeArg.endDate) {
      const parsedEnd = parseDay(rangeArg.endDate);
      if (parsedEnd) rangeEnd = parsedEnd;
    }

    if (rangeArg.startDate) {
      rangeStart = parseDay(rangeArg.startDate);
    }

    if (typeof rangeArg.days === "number") {
      targetDays = clampDays(rangeArg.days);
    }
  }

  if (rangeStart && rangeEnd) {
    if (rangeStart > rangeEnd) {
      const temp = rangeStart;
      rangeStart = rangeEnd;
      rangeEnd = temp;
    }

    const diff =
      Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / MILLISECONDS_IN_DAY) + 1;
    if (diff > maxDaysCap) {
      targetDays = maxDaysCap;
      rangeStart = new Date(rangeEnd);
      rangeStart.setUTCDate(rangeEnd.getUTCDate() - (targetDays - 1));
    } else {
      targetDays = clampDays(diff);
    }
  } else {
    if (!targetDays) targetDays = clampDays(50);

    if (!rangeStart) {
      rangeStart = new Date(rangeEnd);
      rangeStart.setUTCDate(rangeEnd.getUTCDate() - (targetDays - 1));
    } else {
      rangeEnd = new Date(rangeStart);
      rangeEnd.setUTCDate(rangeStart.getUTCDate() + (targetDays - 1));
    }
  }

  const targetRangeStartMs = rangeStart.getTime();
  const totalsByDate = new Map();
  let beforeCursor = null;
  let requestCount = 0;
  const maxRequests = Math.min(20, Math.max(1, Math.ceil(targetDays / 25)));

  while (totalsByDate.size < targetDays && requestCount < maxRequests) {
    const params = beforeCursor ? { before: String(beforeCursor) } : undefined;
    const res = await getRecentlyPlayed(50, params);
    requestCount += 1;

    if (!res.ok) {
      console.warn(`[spotify] failed to load recent playback (${res.status})`);
      break;
    }

    const json = await res.json();
    const items = json?.items ?? [];
    if (!items.length) break;

    for (const item of items) {
      const playedAt = item?.played_at;
      const track = item?.track;
      if (!playedAt || !track) continue;

      const date = playedAt.slice(0, 10); // YYYY-MM-DD
      const duration = track.duration_ms ?? 0;
      const existing = totalsByDate.get(date) ?? 0;

      totalsByDate.set(date, existing + Math.round(duration / 1000));
    }

    const oldest = items[items.length - 1];
    const oldestPlayedAt = oldest?.played_at;
    if (!oldestPlayedAt) break;

    const oldestTimestamp = new Date(oldestPlayedAt).getTime();
    if (!Number.isFinite(oldestTimestamp) || oldestTimestamp < 0) break;
    if (oldestTimestamp <= targetRangeStartMs) break;

    const nextCursor = oldestTimestamp - 1;
    if (beforeCursor !== null && nextCursor >= beforeCursor) break;

    beforeCursor = nextCursor;
  }

  if (!totalsByDate.size) return [];

  const results = [];
  const current = new Date(rangeStart);

  for (let i = 0; i < targetDays; i++) {
    const iso = current.toISOString().slice(0, 10);
    const total = totalsByDate.get(iso) ?? 0;

    results.push({
      date: iso,
      total,
      categories: total ? [{ name: "Listening", total }] : [],
    });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return results;
}

export function formatDate(dateString) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const [year, month, day] = dateString.split("-");
  const formattedMonth = months[parseInt(month) - 1];

  return `${day} ${formattedMonth} ${year.slice(2)}`;
}

export function chunkArray(array, chunkSize) {
  const chunks = [];
  let currentChunk = [];

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split("T")[0];

  // Fill the first chunk with placeholders if the first date does not start on a Sunday
  const startDate = new Date(array[0].date);
  const startDayOfWeek = startDate.getDay();
  if (startDayOfWeek !== 0) {
    const placeholders = startDayOfWeek;
    for (let i = 0; i < placeholders; i++) {
      const previousDate = new Date(startDate);
      previousDate.setDate(startDate.getDate() - (startDayOfWeek - i));
      currentChunk.push({
        date: formatDate(previousDate),
        total: 0,
      });
    }
  }

  // Add the actual data to the current chunk
  array.forEach((day) => {
    currentChunk.push(day);
    if (currentChunk.length === chunkSize) {
      chunks.push(currentChunk);
      currentChunk = [];
    }
  });

  // Add placeholders to the last chunk if necessary
  if (currentChunk.length > 0) {
    const lastDate = new Date(currentChunk[currentChunk.length - 1].date);
    while (currentChunk.length < chunkSize) {
      lastDate.setDate(lastDate.getDate() + 1);
      currentChunk.push({
        date: formatDate(lastDate),
        total: 0,
      });
    }
    chunks.push(currentChunk);
  }

  // Ensure each chunk follows [s, m, t, w, t, f, s] pattern
  return chunks.map((chunk) => {
    const sortedChunk = [];
    const daysOfWeek = ["0", "1", "2", "3", "4", "5", "6"]; // Sunday to Saturday

    daysOfWeek.forEach((day) => {
      chunk.forEach((entry) => {
        if (new Date(entry.date).getDay().toString() === day) {
          sortedChunk.push(entry);
        }
      });
    });

    return sortedChunk;
  });
}

export function getTopThreePosts(posts) {
  // Sort the posts by date in descending order
  const sortedPosts = posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Get the top 4 most recent posts
  return sortedPosts.slice(0, 3);
}
