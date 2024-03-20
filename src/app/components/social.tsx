import {Header} from "@/app/components/header";
import {SmallLink} from "@/app/components/smallLink";

export default function Social() {
	return (
		<div>
			<Header title={"social"}/>
			<div className={"flex flex-col"}>
				<SmallLink title={"twitter.com"} link={"https://twitter.com/lukey_stephens"}/>
				<SmallLink title={"layers.to"} link={"https://layers.to/lukey"}/>
				<SmallLink title={"thecrag.com"} link={"https://www.thecrag.com/climber/luke6"}/>
			</div>
		</div>
	);
};