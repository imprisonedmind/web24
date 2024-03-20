import {Header} from "@/components/header";

export default function Education() {
  return (
		<div>
			<Header title={"education"}/>
			<div className={"flex flex-col"}>
				<p className={"text-sm text-neutral-500"}>
					BA Visual Communications Degree
					<br/>
					<span className={"italic"}>major in multimedia &apos;18-20</span>
				</p>
			</div>
		</div>
	);
};