import {Header} from "@/components/header";
import {SmallLink} from "@/components/smallLink";

export default function Tech() {
  return (
		<div className={"px-4 md:px-0"}>
			<Header title={"tech"}/>
			<div className={"flex flex-col"}>
				<SmallLink title={"NextJs"} link={"https://nextjs.org/"}/>
				<SmallLink title={"Django"} link={"https://www.djangoproject.com/"}/>
				<SmallLink title={"Supabase"} link={"https://supabase.com"}/>
				<SmallLink title={"Firebase"} link={"https://firebase.google.com/"}/>
				<SmallLink title={"React Native"} link={"https://reactnative.dev/"}/>
				<SmallLink title={"Flutter"} link={"https://flutter.dev/"}/>
				<SmallLink title={"MongoDB"} link={"https://www.mongodb.com/"}/>
				<SmallLink title={"Postgres"} link={"https://www.postgresql.org/"}/>
				<SmallLink title={"OpenAI"} link={"https://openai.com/"}/>
				<SmallLink title={"Tailwind"} link={"https://tailwindcss.com/"}/>
				<SmallLink title={"Figma"} link={"https://www.figma.com/"}/>
			</div>
		</div>
	);
};