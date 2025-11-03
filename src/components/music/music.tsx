import { MusicClient } from "@/components/music/musicClient";
import { returnSongData } from "@/lib/util";

const revalidate = 0;

export default async function Music() {
  const songData = await returnSongData(true);

  return <MusicClient initialSongData={songData} />;
}
