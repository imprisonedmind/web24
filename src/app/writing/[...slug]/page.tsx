import {NotionAPI} from "notion-client";
import {NotionPage} from "@/components/wrapper/notionPage";

export default async function Page({params} : {params: {slug: string[]}}) {
	const id = params.slug[1]

	const notion = new NotionAPI();
	const recordMap = await notion.getPage(id);


	return (
		<NotionPage recordMap={recordMap} />
	);
};