import { Header } from "@/components/header";
import { getTopWritingPosts } from "@web24/content";
import { Post } from "@/lib/types";
import { WritingPreviewLink } from "@/components/writing/writingPreviewLink";

export default function WritingList() {
  return (
    <div className={"-mt-4 flex w-full flex-col gap-1 px-4 md:mt-0 md:px-0"}>
      <Header title={"writing"} seeAll={true} link={"writing"} />

      {getTopWritingPosts().map((item: Post) => (
        <WritingPreviewLink key={item.id} item={item} />
      ))}
    </div>
  );
}
