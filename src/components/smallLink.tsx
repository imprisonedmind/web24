import { FC } from "react";
import Link from "next/link";

interface SmallLinkProps {
  title: string;
  link: string;
}

export const SmallLink: FC<SmallLinkProps> = ({ title, link }) => {
  return (
    <Link
      prefetch={true}
      href={link}
      className="
        flex w-max text-sm text-neutral-500 underline-offset-4 hover:underline
      "
    >
      <p>{title}</p>
    </Link>
  );
};
