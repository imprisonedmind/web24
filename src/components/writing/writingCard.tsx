import { FC } from "react";
import { spaceToHyphen } from "@/lib/util";
import Image from "next/image";
import Link from "next/link";
import { Post } from "@/lib/types";
import { ReviewScore } from "@/components/writing/reviewScore";

interface WritingCardProps {
  item: Post;
  isReview?: boolean;
}

export const WritingCard: FC<WritingCardProps> = ({ item, isReview }) => {
  return (
    <Link
      prefetch={true}
      href={`/${isReview ? "reviews" : "writing"}/${spaceToHyphen(item.title)}/${item.id}`}
      className="
        flex w-full flex-col gap-4 overflow-clip rounded-xl bg-white p-2
        shadow-sm transition duration-300 ease-in-out hover:shadow-md
      "
    >
      <Image
        src={`/${item.openGraph}`}
        alt={item.title}
        width={300}
        height={300}
        className="
          max-h-[160px] w-full rounded-lg bg-gray-200 object-cover
        "
      />

      <div className={"flex flex-col gap-1 px-1 !pt-0 pb-2"}>
        <div className={"flex flex-row items-center justify-between"}>
          <p className={"line-clamp-1 font-medium"}>{item.title}</p>

          <p className={"flex-shrink-0 text-xs"}>{item.date}</p>
        </div>

        <p className={"line-clamp-3 text-sm text-neutral-500"}>
          {item.description}
        </p>

        {item.score !== undefined && (
          <span className="mt-1">
            <ReviewScore score={item.score!} />
          </span>
        )}
      </div>
    </Link>
  );
};
