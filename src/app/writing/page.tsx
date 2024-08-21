import blogData from "@/lib/blogData.json";
import reviewData from "@/lib/reviewData.json";
import Breadcrumbs from "@/components/breadcrumbs";
import { WritingCard } from "@/components/writing/writingCard";
import { Post } from "@/lib/types";

export default function Page() {
  const data = [...blogData, ...reviewData];

  return (
    <div
      className={
        "mx-auto flex max-w-[720px] flex-col gap-4 px-[calc(min(16px,8vw))] py-4"
      }
    >
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
    </div>
  );
}
