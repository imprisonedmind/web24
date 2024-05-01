import {Header} from "@/components/header";
import {WorkCard} from "@/components/workCard";
import {WorkCardData, workData} from "@/lib/workData";


export default function Work() {
	return (
		<div className={""}>
			<div className={"px-4 md:px-0"}>
				<Header title={"work"} seeAll={true} link={"work"}/>
			</div>
			<div className={
				"flex flex-row pb-4 px-4 md:grid grid-cols-3 gap-2 md:gap-4 md:px-0" +
				" overflow-x-auto"
			}>
				{workData().slice(0,3).map((item: WorkCardData, index: number) => {
					return (
						<WorkCard
							key={index}
							title={item.title}
							link={item.link}
							tag={item.tag}
							src={item.src}
							alt={item.alt}
						/>
					)
				})}
			</div>
		</div>
	);
};