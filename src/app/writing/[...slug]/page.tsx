import {NotionAPI} from "notion-client";
import {NotionPage} from "@/components/wrapper/notionPage";
import data from "@/lib/data.json"
import {spaceToHyphen} from "@/lib/util";

export default async function Page({params}: { params: { slug: string[] } }) {
	const id = params.slug[1]

	const notion = new NotionAPI();
	const recordMap = await notion.getPage(id);


	return (
		<NotionPage recordMap={recordMap}/>
	);
};


export async function generateMetadata({params}: { params: { slug: string[] } }) {
	const id = params.slug[1]
	const blogData = data.find(obj => obj.id === id) ?? null;

	const title = blogData?.title
	const description = blogData?.description
	const imgUrl = blogData?.openGraph

	return {
		title: title,
		description: description,
		openGraph: {
			type: "website",
			url: `https://lukestephens.co.za/writing/${spaceToHyphen(title)}/${id}`,
			title: title,
			description: description,
			siteName: "Luke Stephens",
			images: [
				{
					url: `/${blogData?.openGraphSmall}`,
					width: 1024,
					height: 683,
					alt: title,
				},
				{
					url: `/${imgUrl}`,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			site: "@site",
			creator: "@lukey_stephens",
			images: `/${imgUrl}`
		}
	}
}
