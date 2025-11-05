import { FC } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";

interface WorkCardProps {
  title: string;
  link: string;
  tag: string;
  src: StaticImageData | string;
  alt: string;
  internal?: boolean;
}

export const WorkCard: FC<WorkCardProps> = (props) => {
  const { title, link, tag, src, alt, internal } = props;

  return (
    <Link
      prefetch={true}
      href={link}
      target={internal ? "_self" : "_blank"}
      className={`
        flex min-w-[185px] flex-col gap-2 rounded-xl bg-white p-2 shadow-sm 
        transition duration-150 ease-in-out hover:shadow-md
      `}
    >
      <div className={"relative h-36 w-full overflow-hidden rounded-lg"}>
        <Image
          src={src}
          alt={alt}
          fill={true}
          priority={true}
          sizes={"50vw"}
          placeholder={"blur"}
          className={"w-full bg-gray-200 object-cover"}
        />
      </div>
      <div>
        <div className={"flex justify-between"}>
          <p className={"w-max text-sm"}>{title}</p>
          <p className={"rounded-full bg-neutral-100 p-1 px-2 text-xs"}>
            {tag}
          </p>
        </div>
      </div>
    </Link>
  );
};
