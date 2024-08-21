import { Header } from "@/components/header";
import { SmallLink } from "@/components/smallLink";
import data from "@/lib/reviewData.json";
import { getTopThreePosts, spaceToHyphen } from "@/lib/util";
import { Post } from "@/lib/types";
import { ReviewScore } from "@/components/writing/reviewScore";

export default function ReviewList() {
  return (
    <div className={"-mt-4 flex w-full flex-col gap-1 px-4 md:mt-0 md:px-0"}>
      <Header title={"reviews"} seeAll={true} link={"reviews"} />

      {getTopThreePosts(data).map((item: Post, index: number) => (
        <span key={index} className="flex items-center justify-between">
          <SmallLink
            title={item.title}
            link={`/reviews/${spaceToHyphen(item.title)}/${item.id}`}
          />
          {item.score !== undefined && <ReviewScore score={item.score} />}
        </span>
      ))}
    </div>
  );
}
