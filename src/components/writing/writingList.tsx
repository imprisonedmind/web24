import { Header } from "@/components/header";
import { SmallLink } from "@/components/smallLink";
import data from "@/lib/blogData.json";
import { getTopThreePosts, spaceToHyphen } from "@/lib/util";
import { Post } from "@/lib/types";

export default function WritingList() {
  return (
    <div className={"-mt-4 flex w-full flex-col gap-1 px-4 md:mt-0 md:px-0"}>
      <Header title={"writing"} seeAll={true} link={"writing"} />

      {getTopThreePosts(data).map((item: Post, index: number) => (
        <SmallLink
          key={index}
          title={item.title}
          link={`/writing/${spaceToHyphen(item.title)}/${item.id}`}
        />
      ))}
    </div>
  );
}
