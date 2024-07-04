import { Header } from "@/components/header";
import { SmallLink } from "@/components/smallLink";
import data from "@/lib/blogData.json";
import { spaceToHyphen } from "@/lib/util";

export default function WritingList() {
  const smallData = data.slice(0, 3);

  return (
    <div className={"-mt-4 flex w-full flex-col gap-1 px-4 md:mt-0 md:px-0"}>
      <Header title={"writing"} seeAll={true} link={"writing"} />

      {smallData.map((item, index) => (
        <SmallLink
          key={index}
          title={item.title}
          link={`/writing/${spaceToHyphen(item.title)}/${item.id}`}
        />
      ))}
    </div>
  );
}
