import data from "@/lib/blogData.json"
import Image from "next/image";
import Link from "next/link";
import {spaceToHyphen} from "@/lib/util";
import GoBack from "@/components/goBack";

export default function Page() {

	return (
		<div className={
			"flex py-4 flex-col max-w-[720px] mx-auto px-[calc(min(16px,8vw))] gap-8"
		}>
			<GoBack/>
			<div className={`
			grid grid-cols-1 gap-4 cursor-pointer
		`}>
				{data.map((blog, index) => {
					return (
						<Link
							href={`/writing/${spaceToHyphen(blog.title)}/${blog.id}`}
							key={index}
							className={
								"flex flex-col gap-4 w-full bg-white shadow-sm p-4" +
								" rounded-xl overflow-clip hover:shadow-md transition ease-in-out" +
								" duration-300"
							}
						>
							<Image
								src={`/${blog.openGraph}`}
								alt={blog.title}
								width={300}
								height={300}
								className={"w-full rounded-lg object-cover"}
							/>
							<div className={"flex flex-col gap-1"}>
								<div className={"flex flex-row justify-between items-center"}>
									<p className={"font-medium"}>{blog.title}</p>
									<p className={"text-xs"}>{blog.date}</p>
								</div>
								<p className={"text-sm truncate"}>{blog.description}</p>
							</div>
						</Link>
					)
				})}
			</div>
		</div>
	);
};