import {Header} from "@/components/header";
import {WorkCard} from "@/components/workCard";
import {WorkCardData, workData} from "@/lib/workData";


export default function Work() {
	return (
		<div className={""}>
			<div className={"pl-4 md:pl-0"}>
				<Header title={"work"} seeAll={true} link={"work"}/>
			</div>
			<div className={
				"px-4 md:px-0 flex flex-nowrap gap-2 md:gap-4 w-full mt-1 overflow-x-scroll pb-4"
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