import {Header} from "@/components/header";
import {SmallLink} from "@/components/smallLink";
import data from "@/lib/blogData.json"
import {spaceToHyphen} from "@/lib/util";

export default function WritingList() {
	return (
		<div className={"w-full px-4 md:px-0"}>
			<Header title={"writing"} seeAll={true} link={"writing"}/>
			{data.map((item, index) =>
				<SmallLink
					key={index}
					title={item.title}
					link={`/writing/${spaceToHyphen(item.title)}/${item.id}`}
				/>
			)}
		</div>
	);
};