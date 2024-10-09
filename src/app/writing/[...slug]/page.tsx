import { NotionAPI } from "notion-client";
import { NotionPage } from "@/components/wrapper/notionPage";
import blogData from "@/lib/blogData.json";
import reviewData from "@/lib/reviewData.json";
import { spaceToHyphen } from "@/lib/util";
import Breadcrumbs from "@/components/breadcrumbs";
import { ReviewScore } from "@/components/writing/reviewScore";
import { Post } from "@/lib/types";

export default async function Page({ params }: { params: { slug: string[] } }) {
  const id = params.slug[1];

  const notion = new NotionAPI();
  const recordMap = await notion.getPage(id);

  const data: Post[] = [...blogData, ...reviewData];
  const item = data.find((obj) => obj.id === id) ?? null;
  const date = item?.date;
  const score = item?.score;

  return (
    <div>
      <div
        className={
          "mx-auto flex w-full max-w-[720px] justify-between px-[calc(min(16px,8vw))]"
        }
      >
        <Breadcrumbs />
        {score !== undefined && <ReviewScore score={score!} />}
        <p className={"flex w-max flex-shrink-0"}>{date}</p>
      </div>
      <NotionPage recordMap={recordMap} />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}) {
  const id = params.slug[1];
  const data: Post[] = [...blogData, ...reviewData];
  const item = data.find((obj) => obj.id === id) ?? null;

  const title = item?.title;
  const description = item?.description;
  const imgUrl = item?.openGraph;

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
          url: `/${item?.openGraphSmall}`,
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
      images: `/${imgUrl}`,
    },
  };
}
