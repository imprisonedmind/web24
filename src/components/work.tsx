import {Header} from "@/components/header";
import {WorkCard} from "@/components/workCard";
import trinity from "/public/trinity.png"
import giggity from "/public/giggity2.png"

export default function Work() {
	return (
		<div className={"pl-4 md:pl-0"}>
			<Header title={"work"} seeAll={true} link={"work"} />
			<div className={
				"flex flex-nowrap gap-2 md:gap-4 w-full pb-1 mt-1 overflow-x-scroll"
			}>
				<WorkCard
					title={"Trinity Telecomm"}
					link={"https://trinity.co.za"}
					tag={"website"}
					src={trinity}
					alt={"Trinity website cover image"}
				/>
				<WorkCard
					title={"Giggity"}
					link={"https://giggity.co.za"}
					tag={"web app"}
					src={giggity}
					alt={"Giggity.co.za website cover image"}
				/>
			</div>
		</div>
	);
};