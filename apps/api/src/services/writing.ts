import { NotionAPI } from "notion-client";

const notion = new NotionAPI();

export async function getWritingRecordMap(id: string) {
  return notion.getPage(id);
}
