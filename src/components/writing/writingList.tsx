import { Header } from "@/components/header";
import blogData from "@/lib/blogData.json";
import reviewData from "@/lib/reviewData.json";
import { getTopThreePosts } from "@/lib/util";
import { Post } from "@/lib/types";
import { WritingPreviewLink } from "@/components/writing/writingPreviewLink";

export default function WritingList() {
  const data = [...blogData, ...reviewData];

  return (
    <div className={"-mt-4 flex w-full flex-col gap-1 px-4 md:mt-0 md:px-0"}>
      <Header title={"writing"} seeAll={true} link={"writing"} />

      {getTopThreePosts(data).map((item: Post) => (
        <WritingPreviewLink key={item.id} item={item} />
      ))}
    </div>
  );
}
