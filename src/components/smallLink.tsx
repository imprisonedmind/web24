import { FC } from "react";
import Link from "next/link";

interface SmallLinkProps {
  title: string;
  link: string;
  target?: boolean;
}

export const SmallLink: FC<SmallLinkProps> = ({
  title,
  link,
  target = false,
}) => {
  return (
    <Link
      prefetch={true}
      href={link}
      target={target ? "_blank" : "_self"}
      className="
        flex w-max text-sm text-neutral-500 underline-offset-4 hover:underline
      "
    >
      <p>{title}</p>
    </Link>
  );
};
