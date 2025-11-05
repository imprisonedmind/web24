import blogData from "@/lib/blogData.json";
import reviewData from "@/lib/reviewData.json";
import Breadcrumbs from "@/components/breadcrumbs";
import { WritingCard } from "@/components/writing/writingCard";
import { Post } from "@/lib/types";
import { PageContainer } from "@/components/ui/page-container";
import { createMetadata, createSeoProps, type CreateMetadataOptions } from "@/lib/seo";
import { Seo } from "@/components/seo/seo";

const WRITING_SEO: CreateMetadataOptions = {
  title: "Writing | Luke Stephens",
  description:
    "Selected essays, reviews, and notes by Luke Stephens covering design, technology, and entertainment.",
  path: "/writing",
  type: "article"
};

export const metadata = createMetadata(WRITING_SEO);
const writingSeo = createSeoProps(WRITING_SEO);

export default function Page() {
  const data = [...blogData, ...reviewData];

  return (
    <PageContainer className="flex flex-col gap-4 px-[calc(min(16px,8vw))] py-4">
      <Seo {...writingSeo} />
      <Breadcrumbs />
      <div className={`grid cursor-pointer grid-cols-1 gap-4 sm:grid-cols-2`}>
        {data
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          .map((item: Post, index) => {
            return (
              <WritingCard
                item={item}
                key={index}
                isReview={item.score !== undefined}
              />
            );
          })}
      </div>
    </PageContainer>
  );
}
