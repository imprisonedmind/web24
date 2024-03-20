import {Header} from "@/components/header";
import {SmallLink} from "@/components/smallLink";

export default function WritingList() {
  return (
		<div className={"w-full"}>
			<Header title={"writing"}/>
			<SmallLink
				title={"revamping our mobile experience"}
				link={'/writing/something/0e05c93cd6af475ea91c7abf74f8959d'}
			/>
		</div>
	);
};