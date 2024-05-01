import Image from "next/image";
import Social from "@/components/social";
import Employment from "@/components/employment";
import Education from "@/components/education";
import Work from "@/components/work";
import WritingList from "@/components/writingList";
import Bio from "@/components/bio";
import Tech from "@/components/tech";

import luke from "/public/luke2.jpg"
import Location from "@/components/location";
import Music from "@/components/music";

export default function Home() {

	return (
		<main className="flex flex-col gap-8 max-w-[600px] mx-auto mb-8">
			<div className={"flex flex-col md:flex-row justify-between gap-4 mt-8"}>
				<Image
					src={luke}
					alt={"Luke Stephens"}
					placeholder={"blur"}
					priority={true}
					width={300}
					height={500}
					className={"mx-auto hidden md:flex"}
				/>
				<div className={"flex flex-col justify-between px-4 md:px-0 gap-4 md:gap-0"}>
					<Bio/>
					<Social/>
					<Employment/>
					<Education/>
				</div>
			</div>
			<div className={"flex flex-col gap-8"}>
				<Work/>
				<WritingList/>
				<Music/>
				<Location/>
				<Tech/>
			</div>
		</main>
	);
}


