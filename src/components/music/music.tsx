import { MusicClient } from "@/components/music/musicClient";

const revalidate = "force-no-store";

export const getSongData = async () => {
  const res = await fetch("https://lukestephens.co.za/api/currentlyPlaying", {
    cache: "no-cache",
  });
  return await res.json();
};

export default async function Music() {
  const songData = await getSongData();

  return <MusicClient initialSongData={songData} />;
}
