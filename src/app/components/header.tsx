import {FC} from "react";

interface HeaderProps {
  title: string;
}

export const Header: FC<HeaderProps> = (props) => {
  const { title } = props;

  return (
		<h1 className={"text-lg font-medium"}>{title}</h1>

	);
};