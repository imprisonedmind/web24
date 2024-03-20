import Image from "next/image";
import {Header} from "@/app/components/header";
import {WorkCard} from "@/app/components/workCard";
import Link from "next/link";
import {SmallLink} from "@/app/components/smallLink";
import Social from "@/app/components/social";
import Employment from "@/app/components/employment";
import Education from "@/app/components/education";

export default function Home() {
	return (
		<main className="flex flex-col gap-8 max-w-[600px] mx-auto mb-8">
			<div className={"flex flex-row justify-between gap-4 mt-8"}>
				<Image
					src={"/luke2.jpg"}
					alt={"Luke Stephens"}
					width={300}
					height={500}
				/>
				<div className={"flex flex-col justify-between"}>
					<div>
						<h1 className={"text-xl font-medium"}>luke stephens</h1>
						<h2 className={"text-neutral-500"}>
							an individual, type-4 enneagram, passionate, dedicated, resilient.
						</h2>
					</div>
					<Social/>
					<Employment/>
					<Education/>
				</div>
			</div>
			<div>
				<Header title={"work"}/>
				<div className={
					"flex flex-nowrap gap-4 w-full pb-1 mt-1"
				}>
					<WorkCard
						title={"Trinity Telecomm"}
						link={"https://trinity.co.za"}
						tag={"website"}
						src={"/trinity.png"}
						alt={"Trinity website cover image"}
					/>
					<WorkCard
						title={"Giggity"}
						link={"https://giggity.co.za"}
						tag={"web app"}
						src={"/giggity2.png"}
						alt={"Giggity.co.za website cover image"}
					/>
				</div>
			</div>
			<div>
				<Header title={"writing"}/>
				<Link href={"/"}
							className={"text-sm text-neutral-500 hover:underline underline-offset-2"}>
					Hello World!
				</Link>
			</div>


			<div>
				<Header title={"tech"}/>
				<div className={"flex flex-col"}>
					<SmallLink title={"NextJs"} link={"https://twitter.com/lukey_stephens"}/>
					<SmallLink title={"Django"} link={"https://layers.to/lukey"}/>
					<SmallLink title={"Supabase"} link={"https://layers.to/lukey"}/>
					<SmallLink title={"React Native"} link={"https://layers.to/lukey"}/>
					<SmallLink title={"Flutter"} link={"https://layers.to/lukey"}/>
					<SmallLink title={"Firebase"} link={"https://layers.to/lukey"}/>
					<SmallLink title={"MongoDB"} link={"https://layers.to/lukey"}/>
					<SmallLink title={"Postgres"} link={"https://layers.to/lukey"}/>
					<SmallLink title={"Tailwind"} link={"https://layers.to/lukey"}/>
					<SmallLink title={"Figma"} link={"https://layers.to/lukey"}/>
				</div>
			</div>
		</main>
	);
}
