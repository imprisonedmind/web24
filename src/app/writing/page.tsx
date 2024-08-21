import data from "@/lib/blogData.json";
import Breadcrumbs from "@/components/breadcrumbs";
import { WritingCard } from "@/components/writing/writingCard";

export default function Page() {
  return (
    <div
      className={
        "mx-auto flex max-w-[720px] flex-col gap-4 px-[calc(min(16px,8vw))] py-4"
      }
    >
      <Breadcrumbs />
      <div className={`grid cursor-pointer grid-cols-1 gap-4 sm:grid-cols-2`}>
        {data.map((blog, index) => {
          return <WritingCard item={blog} key={index} />;
        })}
      </div>
    </div>
  );
}
