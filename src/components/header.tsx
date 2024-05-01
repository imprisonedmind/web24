import {FC} from "react";
import {SmallLink} from "@/components/smallLink";

interface HeaderProps {
	title: string;
	seeAll?: boolean;
	link?: string;
}

export const Header: FC<HeaderProps> = (props) => {
	const {title, seeAll, link} = props;

	return (
		<div className={"w-full justify-between flex items-center"}>
			<h1 className={"text-lg font-medium w-fit"}>{title}</h1>
			{seeAll && link && <SmallLink link={link} title={"see all"}/>}
		</div>
	);
};