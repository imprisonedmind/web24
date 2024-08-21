export interface songData {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
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
