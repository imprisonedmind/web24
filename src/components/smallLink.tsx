import { FC } from "react";
import Link from "next/link";

interface SmallLinkProps {
  title: string;
  link: string;
}

export const SmallLink: FC<SmallLinkProps> = (props) => {
  const { title, link } = props;

  return (
    <Link
      prefetch={true}
      href={link}
      className={
        "flex w-max text-sm text-neutral-500 underline-offset-2 hover:underline"
      }
    >
      {title}
    </Link>
  );
};
