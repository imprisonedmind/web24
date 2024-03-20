import {FC} from "react";

interface BulletPointProps {
  title: string;
  date: string;
}

export const BulletPoint: FC<BulletPointProps> = (props) => {
  const { title, date } = props;

  return (
		<div className={"flex flex-row items-center gap-2 ml-3"}>
			<div className={"h-1 w-1 bg-neutral-300 rounded-full"}/>
			<p className={"text-xs text-neutral-500 italic tracking-wide"}>{title}</p>
			<p className={"text-xs text-neutral-500 italic tracking-wide"}>{date}</p>
		</div>
	);
};