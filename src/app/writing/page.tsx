import data from "@/lib/blogData.json";
import Image from "next/image";
import Link from "next/link";
import { spaceToHyphen } from "@/lib/util";
import Breadcrumbs from "@/components/breadcrumbs";

export default function Page() {
  return (
    <div
      className={
        "mx-auto flex max-w-[720px] flex-col gap-4 px-[calc(min(16px,8vw))] py-4"
      }
    >
      <Breadcrumbs />
      <div className={`grid cursor-pointer grid-cols-1 gap-4`}>
        {data.map((blog, index) => {
          return (
            <Link
              prefetch={true}
              href={`/writing/${spaceToHyphen(blog.title)}/${blog.id}`}
              key={index}
              className={`
                flex w-full flex-col gap-4 overflow-clip rounded-xl bg-white p-4
                shadow-sm transition duration-300 ease-in-out hover:shadow-md
             `}
            >
              <Image
                src={`/${blog.openGraph}`}
                alt={blog.title}
                width={300}
                height={300}
                className={"max-h-[400px] w-full rounded-lg object-cover"}
              />
              <div className={"flex flex-col gap-1"}>
                <div className={"flex flex-row items-center justify-between"}>
                  <p className={"font-medium"}>{blog.title}</p>
                  <p className={"text-xs"}>{blog.date}</p>
                </div>
                <p className={"truncate text-sm"}>{blog.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
