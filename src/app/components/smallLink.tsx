import {FC} from "react";
import Link from "next/link";

interface SmallLinkProps {
	title: string;
	link: string;
}

export const SmallLink: FC<SmallLinkProps> = (props) => {
	const {title, link} = props;

	return (
		<Link
			href={link}
			className={"text-sm text-neutral-500 hover:underline underline-offset-2"}>
			{title}
		</Link>
	);
};