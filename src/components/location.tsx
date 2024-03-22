import {Header} from "@/components/header";
import BlueDot from "@/components/blueDot";
import Image from "next/image";

import map from "/public/map.png"
export default function Location() {
  return (
		<div className={"w-full flex flex-col gap-1"}>
			<Header title={"location"}/>
			<div className={
				"flex flex-col gap-2 bg-white shadow-sm p-2 w-[416px] rounded-xl"
			}>
				<div className={"relative w-full h-72 overflow-hidden rounded-lg"}>
					<BlueDot/>
					<Image
						src={map}
						alt={"test"}
						fill={true}
						priority={true}
						placeholder={"blur"}
						className={"object-cover scale-[1.2]"}
					/>
				</div>
				<div className={"flex justify-between items-center"}>
					<p className={"text-neutral-800 text-sm"}>Cape Town</p>
					<div className={
						"text-[10px] bg-neutral-100 flex w-fit p-2 rounded-full tracking-wide"
					}>
						<p>-33.93,</p>
						<p>18.47</p>
					</div>
				</div>
			</div>
		</div>
	);
};