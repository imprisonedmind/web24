import {Header} from "@/app/components/header";

export default function Education() {
  return (
		<div>
			<Header title={"education"}/>
			<div className={"flex flex-col"}>
				<p className={"text-sm text-neutral-500"}>
					BA Visual Communications Degree
					<br/>
					<span className={"italic"}>Major in Multimedia &apos;18-20</span>
				</p>
			</div>
		</div>
	);
};