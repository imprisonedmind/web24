import { MusicClient } from "@/components/music/musicClient";

export const getSongData = async () => {
  const res = await fetch("__REMOVED_SITE_URL__/api/currentlyPlaying", {
    cache: "no-cache",
  });
  return await res.json();
};

export default async function Music() {
  const songData = await getSongData();

  return <MusicClient initialSongData={songData} />;
}
