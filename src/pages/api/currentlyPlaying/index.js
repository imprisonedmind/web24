import { returnSongData } from "../../../lib/util";

export default async function Index(_, res) {
  const response = await returnSongData(true);
  console.log("[spotify] API response payload", {
    hasTrack: Boolean(response?.title),
    isPlaying: Boolean(response?.isPlaying),
    source: response?.source ?? "unknown",
    playedAt: response?.playedAt ?? null,
  });

  if (response) {
    return res.status(200).json(response);
  }

  return res.status(200).json(null);
}
