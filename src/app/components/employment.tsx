import {Header} from "@/app/components/header";
import {BulletPoint} from "@/app/components/bulletPoint";

export default function Employment() {
	return (
		<div>
			<Header title={"employment"}/>
			<div className={"flex flex-col"}>
				<p className={"text-sm text-neutral-500"}>Trinity Telecomm (PTY) LTD</p>
				<BulletPoint title={"Design and Research Lead"} date={"'23-current"}/>
				<BulletPoint title={"Software Designer"} date={"'21-23"}/>
			</div>
			<div className={"flex flex-col"}>
				<p className={"text-sm text-neutral-500"}>Specno</p>
				<BulletPoint title={"Multimedia Designer"} date={"'19-20"}/>
			</div>
		</div>
	);
};