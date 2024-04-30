import {Header} from "@/components/header";
import {SmallLink} from "@/components/smallLink";

export default function WritingList() {
	return (
		<div className={"w-fit px-4 md:px-0"}>
			<Header title={"writing"}/>
			<SmallLink
				title={"notion for blog post creation and hosting"}
				link={'/writing/notion-for-blog-post-creation-and-hosting/ebfc2f63277a40a9aeefe50a85fb2ea2'}
			/>
			<SmallLink
				title={"revamping our mobile experience"}
				link={'/writing/revamping-our-mobile-experience/0e05c93cd6af475ea91c7abf74f8959d'}
			/>
			<SmallLink
				title={"device management unit interaction page redesign"}
				link={'/writing/device-management-unit-interaction-page-redesign/9f7ca94172d546f6a98df201a2ff9042'}
			/>
		</div>
	);
};