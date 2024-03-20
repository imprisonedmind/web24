import {Header} from "@/components/header";
import {WorkCard} from "@/components/workCard";
import trinity from "/public/trinity.png"
import giggity from "/public/giggity2.png"

export default function Work() {
  return (
		<div>
			<Header title={"work"}/>
			<div className={
				"flex flex-nowrap gap-4 w-full pb-1 mt-1"
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