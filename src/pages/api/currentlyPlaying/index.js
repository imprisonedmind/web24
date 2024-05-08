import { returnSongData } from "../../../lib/util";

export default async function Index(_, res) {
  const response = await returnSongData();

  if (response) {
    return res.status(200).json(response);
  }
}
