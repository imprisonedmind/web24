import Image from "next/image";
import Social from "@/components/social";
import Employment from "@/components/employment";
import Education from "@/components/education";
import {Header} from "@/components/header";
import {SmallLink} from "@/components/smallLink";
import Work from "@/components/work";
import WritingList from "@/components/writingList";
import Bio from "@/components/bio";


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
					<Bio/>
					<Social/>
					<Employment/>
					<Education/>
				</div>
			</div>
			<Work/>
			<WritingList/>

			<div>
				<Header title={"tech"}/>
				<div className={"flex flex-col"}>
					<SmallLink title={"NextJs"} link={"https://nextjs.org/"}/>
					<SmallLink title={"Django"} link={"https://www.djangoproject.com/"}/>
					<SmallLink title={"Supabase"} link={"https://supabase.com"}/>
					<SmallLink title={"React Native"} link={"https://reactnative.dev/"}/>
					<SmallLink title={"Flutter"} link={"https://flutter.dev/"}/>
					<SmallLink title={"Firebase"} link={"https://firebase.google.com/"}/>
					<SmallLink title={"MongoDB"} link={"https://www.mongodb.com/"}/>
					<SmallLink title={"Postgres"} link={"https://www.postgresql.org/"}/>
					<SmallLink title={"Tailwind"} link={"https://tailwindcss.com/"}/>
					<SmallLink title={"Figma"} link={"https://www.figma.com/"}/>
				</div>
			</div>
		</main>
	);
}
