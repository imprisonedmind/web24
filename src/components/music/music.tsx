import { MusicClient } from "@/components/music/musicClient";

export const getSongData = async () => {
  const res = await fetch("http://localhost:3000/api/currentlyPlaying");
  return await res.json();
};

export default async function Music() {
  const songData = await getSongData();

  if (songData?.isPlaying) {
    return <MusicClient initialSongData={songData} />;
  }
}
