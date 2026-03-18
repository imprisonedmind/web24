import querystring from "node:querystring";

const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENTLY_PLAYED_ENDPOINT = "https://api.spotify.com/v1/me/player/recently-played";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

type SpotifyImage = {
  url?: string | null;
};

type SpotifyTrack = {
  name?: string | null;
  artists?: { name?: string | null }[] | null;
  album?: {
    name?: string | null;
    images?: SpotifyImage[] | null;
  } | null;
  external_urls?: {
    spotify?: string | null;
  } | null;
  duration_ms?: number | null;
};

type RecentlyPlayedItem = {
  track?: SpotifyTrack | null;
  played_at?: string | null;
};

export type RecentlyPlayedTrack = {
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
  playedAt?: string;
  durationMs?: number;
};

export type SongData = {
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

function getEnv(key: string) {
  return process.env[key] ?? process.env[key.toLowerCase()] ?? process.env[key.toUpperCase()];
}

function getBasicAuth() {
  const clientId = getEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = getEnv("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify client credentials");
  }

  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function getAccessToken() {
  const refreshToken = getEnv("SPOTIFY_REFRESH_TOKEN");
  if (!refreshToken) {
    throw new Error("Missing SPOTIFY_REFRESH_TOKEN");
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: querystring.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed with ${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("Spotify token refresh returned no access token");
  }

  return payload.access_token;
}

async function spotifyFetch(url: string) {
  const accessToken = await getAccessToken();
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

function recentlyPlayedUrl(limit = 6) {
  const url = new URL(RECENTLY_PLAYED_ENDPOINT);
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 50)));
  return url.toString();
}

function mapTrack(track?: SpotifyTrack | null, extras: Partial<SongData> = {}) {
  if (!track) return null;

  return {
    isPlaying: Boolean(extras.isPlaying),
    title: track.name || "unknown",
    artist: track.artists?.map(artist => artist.name).filter(Boolean).join(", ") || "unknown",
    album: track.album?.name || "",
    albumImageUrl: track.album?.images?.[0]?.url || "",
    songUrl: track.external_urls?.spotify || "#",
    durationMs: typeof track.duration_ms === "number" ? track.duration_ms : undefined,
    ...extras
  } satisfies SongData;
}

export async function getCurrentlyPlaying(requireTrack = true): Promise<SongData | null> {
  let recentTracks: RecentlyPlayedTrack[] = [];

  try {
    const recentResponse = await spotifyFetch(recentlyPlayedUrl(6));
    if (recentResponse.ok) {
      const recentPayload = (await recentResponse.json()) as { items?: RecentlyPlayedItem[] };
      recentTracks = (recentPayload.items ?? [])
        .map(item =>
          mapTrack(item.track, {
            playedAt: item.played_at ?? undefined
          })
        )
        .filter(Boolean) as RecentlyPlayedTrack[];
    }
  } catch (error) {
    console.error("[api/music] failed to fetch recently played", error);
  }

  try {
    const response = await spotifyFetch(NOW_PLAYING_ENDPOINT);
    if (response.status === 200) {
      const payload = (await response.json()) as {
        is_playing?: boolean;
        currently_playing_type?: string;
        item?: SpotifyTrack | null;
        progress_ms?: number | null;
      };

      if (
        payload.is_playing &&
        payload.currently_playing_type === "track" &&
        payload.item
      ) {
        return {
          ...(mapTrack(payload.item, {
            isPlaying: true,
            progressMs:
              typeof payload.progress_ms === "number" ? payload.progress_ms : undefined
          }) as SongData),
          recentlyPlayed: recentTracks
        };
      }
    }
  } catch (error) {
    console.error("[api/music] failed to fetch currently playing", error);
  }

  if (recentTracks.length) {
    const [latest, ...rest] = recentTracks;
    return {
      ...latest,
      isPlaying: false,
      recentlyPlayed: [latest, ...rest]
    };
  }

  return requireTrack
    ? null
    : {
        isPlaying: false,
        title: "",
        artist: "",
        album: "",
        albumImageUrl: "",
        songUrl: "#",
        recentlyPlayed: []
      };
}
