import { MusicClient } from "@/components/music/musicClient";
import { returnSongData } from "@/lib/util";

const revalidate = 0;

export default async function Music() {
  const songData = await returnSongData();

  console.log(songData);

  // @ts-ignore
  return <MusicClient initialSongData={songData} />;
}
