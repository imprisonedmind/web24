import { NotionAPI } from "notion-client";
import { writingPosts } from "@web24/content";
import { NotionPage } from "@/components/wrapper/notionPage";
import Breadcrumbs from "@/components/breadcrumbs";
import { ReviewScore } from "@/components/writing/reviewScore";
import { Post } from "@/lib/types";
import { PageContainer } from "@/components/ui/page-container";
import { createMetadata, createSeoProps, type CreateMetadataOptions } from "@/lib/seo";
import { Seo } from "@/components/seo/seo";

type WritingPageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function Page({ params }: WritingPageProps) {
  const { slug } = await params;
  const id = slug[1];

  const notion = new NotionAPI();
  const recordMap = await notion.getPage(id);

  const data: Post[] = writingPosts;
  const item = data.find((obj) => obj.id === id) ?? null;
  const date = item?.date;
  const score = item?.score;

  const slugPath = `/writing/${slug.join("/")}`;
  const displayTitle = item?.title ?? "Writing";
  const description = item?.description ?? "Writing by Luke Stephens.";
  const heroImage = item?.openGraph ? `/${item.openGraph}` : undefined;
  const secondaryImage = item?.openGraphSmall
    ? `/${item.openGraphSmall}`
    : undefined;
  const publishedIso = item?.date
    ? new Date(item.date).toISOString()
    : undefined;

  const pageSeo = createSeoProps({
    title: displayTitle,
    description,
    path: slugPath,
    type: "article",
    images: [heroImage, secondaryImage].filter(
      (value): value is string => Boolean(value)
    ),
    publishedTime: publishedIso
  });

  return (
    <PageContainer className="flex flex-col gap-6 px-[calc(min(16px,8vw))]">
      <Seo {...pageSeo} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <Breadcrumbs />

        {(score !== undefined || date) && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3 text-sm text-neutral-600 sm:text-base">
            {score !== undefined && <ReviewScore score={score!} />}
            {date && <p className="whitespace-nowrap">{date}</p>}
          </div>
        )}
      </div>

      <NotionPage recordMap={recordMap} />
    </PageContainer>
  );
}

export async function generateMetadata({
  params,
}: WritingPageProps) {
  const { slug } = await params;
  const id = slug[1];
  const data: Post[] = writingPosts;
  const item = data.find((obj) => obj.id === id) ?? null;
  const slugPath = `/writing/${slug.join("/")}`;
  const title = item?.title ?? "Writing";
  const description = item?.description ?? "Writing by Luke Stephens.";
  const heroImage = item?.openGraph ? `/${item.openGraph}` : undefined;
  const secondaryImage = item?.openGraphSmall
    ? `/${item.openGraphSmall}`
    : undefined;
  const publishedTime = item?.date
    ? new Date(item.date).toISOString()
    : undefined;

  const options: CreateMetadataOptions = {
    title,
    description,
    path: slugPath,
    type: "article",
    images: [heroImage, secondaryImage].filter(
      (value): value is string => Boolean(value)
    ),
    publishedTime
  };

  return createMetadata(options);
}
