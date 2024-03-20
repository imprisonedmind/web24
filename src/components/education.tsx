import {Header} from "@/components/header";
import {BulletPoint} from "@/components/bulletPoint";

export default function Education() {
  return (
		<div>
			<Header title={"education"}/>
			<div className={"flex flex-col"}>
				<p className={"text-sm text-neutral-500"}>
					BA Visual Communications Degree
				</p>
				<BulletPoint title={"major in multimedia"} date={"'18-20"}/>
			</div>
		</div>
	);
};