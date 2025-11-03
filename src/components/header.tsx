import { FC } from "react";
import { SmallLink } from "@/components/smallLink";

interface HeaderProps {
  title: string;
  seeAll?: boolean;
  link?: string;
}

export const Header: FC<HeaderProps> = (props) => {
  const { title, seeAll, link } = props;

  return (
    <div className={"flex w-full items-center justify-between pr-3"}>
      <h1 className={"w-fit text-lg font-medium"}>{title}</h1>
      {seeAll && link && <SmallLink link={link} title={"more"} />}
    </div>
  );
};
