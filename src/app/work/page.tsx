import GoBack from "@/components/goBack";
import {WorkCardData, workData} from "@/lib/workData";
import {WorkCard} from "@/components/workCard";

export default function Page() {
	return (
		<div className={
			"flex py-4 flex-col max-w-[720px] mx-auto px-[calc(min(16px,8vw))] gap-4"
		}>
			<GoBack/>
			<div className={"grid grid-cols-1 md:grid-cols-3 gap-4 w-full"}>
				{workData().map((item: WorkCardData, index: number) => {
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