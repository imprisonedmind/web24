import {FC} from "react";
import Link from "next/link";

interface SmallLinkProps {
	title: string;
	link: string;
	date?: string;
}

export const SmallLink: FC<SmallLinkProps> = (props) => {
	const {title, link, date} = props;

	return (
		<Link
			href={link}
			className={
			"w-full flex text-sm text-neutral-500 hover:underline underline-offset-2"
		}>
			{title}
			{date && <span className={"flex self-end"}>{date}</span>}
		</Link>
	);
};