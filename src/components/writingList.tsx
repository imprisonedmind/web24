import {Header} from "@/components/header";
import {SmallLink} from "@/components/smallLink";

export default function WritingList() {
	return (
		<div className={"w-fit"}>
			<Header title={"writing"}/>
			<SmallLink
				title={"notion for blog post creation and hosting"}
				link={'/writing/notion-for-blog-post-creation-and-hosting/ebfc2f63277a40a9aeefe50a85fb2ea2'}
			/>
			<SmallLink
				title={"revamping our mobile experience"}
				link={'/writing/revamping-our-mobile-experience/0e05c93cd6af475ea91c7abf74f8959d'}
			/>
		</div>
	);
};