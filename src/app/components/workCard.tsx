import {FC} from "react";
import Image from "next/image";
import Link from "next/link";

interface WorkCardProps {
	title: string;
	link: string;
	tag: string;
	src: string;
	alt: string;
}

export const WorkCard: FC<WorkCardProps> = (props) => {
	const {title, link, tag, src, alt} = props;

	return (
		<Link
			href={link}
			className={
				"flex flex-col gap-2 bg-white p-2 shadow-sm rounded-xl min-w-[200px]" +
				" hover:shadow-md transition duration-150 ease-in-out"
			}>
			<div className={"relative h-36 w-full rounded-lg overflow-hidden"}>
				<Image src={src} alt={alt} fill={true} className={"object-cover h-full w-full"}/>
			</div>
			<div>
				<div className={"flex justify-between"}>
					<p className={"text-sm w-max"}>{title}</p>
					<p className={"text-xs p-1 bg-neutral-100 rounded-full px-2"}>{tag}</p>
				</div>
			</div>
		</Link>
	);
};