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
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played?limit=1`;
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

const getRecentlyPlayed = async () => {
  const { access_token } = await getAccessToken();

  return fetch(RECENTLY_PLAYED_ENDPOINT, {
    cache: "no-cache",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

const mapTrackResponse = (track, extras = {}) => {
  if (!track) return null;

  const title = track.name || "unknown";
  const artist = track.artists?.map((_artist) => _artist.name).join(", ") || "unknown";
  const album = track.album?.name || "";
  const albumImageUrl = track.album?.images?.[0]?.url || "";
  const songUrl = track.external_urls?.spotify || "#";

  return {
    album,
    albumImageUrl,
    artist,
    isPlaying: false,
    songUrl,
    title,
    ...extras,
  };
};

export const returnSongData = async (requireTrack = false) => {
  let recentTrack = null;

  try {
    const recentRes = await getRecentlyPlayed();
    if (!recentRes.ok) {
      console.warn(`[spotify] recently played request failed (${recentRes.status})`);
    } else {
      const recent = await recentRes.json();
      const item = recent?.items?.[0];
      recentTrack = mapTrackResponse(item?.track, {
        isPlaying: false,
        playedAt: item?.played_at,
        source: "recently_played",
      });
      if (recentTrack?.title) {
        console.log(`[spotify] fetched recently played track: ${recentTrack.title}`);
      } else {
        console.warn("[spotify] recently played payload missing track information");
      }
    }
  } catch (error) {
    console.error("[spotify] error fetching recently played", error);
  }

  try {
    const response = await getNowPlaying();
    if (response.status === 200) {
      const song = await response.json();

      if (song?.is_playing && song?.currently_playing_type === "track" && song?.item) {
        const playing = mapTrackResponse(song.item, {
          isPlaying: true,
          source: "currently_playing",
        });
        if (playing?.title) {
          console.log(`[spotify] currently playing track: ${playing.title}`);
          return playing;
        }
      } else {
        console.log("[spotify] no active track returned from currently playing endpoint");
      }
    } else if (response.status !== 204) {
      console.warn(`[spotify] currently playing request failed (${response.status})`);
    }
  } catch (error) {
    console.error("[spotify] error fetching currently playing track", error);
  }

  if (recentTrack?.title) {
    return recentTrack;
  }

  if (!requireTrack) {
    return { isPlaying: false };
  }

  console.warn("[spotify] no track data available from Spotify");
  return null;
};

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
