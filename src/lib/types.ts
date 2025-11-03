export interface songData {
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
}

export interface RecentlyPlayedTrack {
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
  playedAt?: string;
  durationMs?: number;
}

export interface Post {
  id: string;
  date: string;
  title: string;
  score?: number;
  openGraph: string;
  openGraphSmall: string;
  description: string;
}
