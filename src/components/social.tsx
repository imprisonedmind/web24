import {Header} from "@/components/header";
import {SmallLink} from "@/components/smallLink";

export default function Social() {
	return (
		<div>
			<Header title={"social"}/>
			<div className={"flex flex-col"}>
				<SmallLink title={"thecrag.com"} link={"https://www.thecrag.com/climber/luke6"}/>
				<SmallLink title={"twitter.com"} link={"https://twitter.com/lukey_stephens"}/>
				<SmallLink title={"layers.to"} link={"https://layers.to/lukey"}/>
				<SmallLink title={"github.com"} link={"https://github.com/imprisonedmind"}/>
			</div>
		</div>
	);
};