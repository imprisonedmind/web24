"use client"
import {Header} from "@/components/header";
import Image from "next/image";
import {useEffect, useState} from "react";
import Link from "next/link";
import {songData} from "@/lib/types";

const getSongData = async () => {
	const res = await fetch("http://localhost:3000/api/currentlyPlaying")
	return await res.json()
}

export default function Music() {
	const [songData, setSongData] = useState<songData | null>(null);

	const fetchSongData = async () => {
		const data = await getSongData();
		setSongData(data);
	}

	useEffect(() => {
		fetchSongData(); // Initial fetch
		const interval = setInterval(() => {
			fetchSongData();
		}, 30000); // Fetch every 30 seconds

		return () => clearInterval(interval); // Cleanup interval on component unmount
	}, []);

	if (songData?.isPlaying) {
		return (
			<div className={"w-full flex flex-col gap-1"}>
				<Header title={"listening"}/>
				<Link href={songData?.songUrl} className={
					"relative flex justify-center items-center h-72 w-[300px] p-4 shadow-sm" +
					" rounded-xl bg-gradient-to-t from-gray-400 to-gray-200 overflow-hidden" +
					" cursor-pointer"
				}>
					{/*ARM THINGY*/}
					<div className={
						"h-36 w-3 absolute z-10 right-[42px] -rotate-[12deg] -top-[60px]" +
						" drop-shadow-md bg-neutral-800 p-2 rounded-full hover:-rotate-[18deg]" +
						" transition duration-150 ease-in-out"
					}>
						<div className={
							"absolute left-1/2 bottom-1/2 bg-neutral-600 w-1 h-3/4 -translate-x-[50%]" +
							" translate-y-[50%] rounded-full"
						}/>

						<div className={
							"absolute bg-neutral-800 w-8 h-4 z-20 -bottom-[6px] -right-[2px]" +
							" -rotate-45 rounded-r-full"
						}>
							<div className={
								"absolute h-3 w-3 bg-neutral-800 z-0 rotate-45 top-1/2 -left-[6px]" +
								" -translate-y-[50%] rounded-sm"
							}/>
							<div className={
								"h-1 w-6 absolute z-20 bottom-1/2 translate-y-[50%] right-1/2" +
								" translate-x-[50%] rounded-full bg-neutral-600 mr-[4px]"}/>
						</div>

					</div>

					<div className={
						"relative w-auto h-full bg-neutral-800 rounded-full aspect-square spinner" +
						" group"
					}>
						{/*Circles*/}
						<div className={
							"absolute h-60 w-60 border border-neutral-900 rounded-full z-10 top-1/2" +
							" left-1/2 -translate-x-[50%] -translate-y-[50%] bg-neutral-700" +
							" bg-neutral-700"
						}/>
						<div className={
							"absolute h-52 w-52 border border-neutral-900 rounded-full z-10 top-1/2" +
							" left-1/2 -translate-x-[50%] -translate-y-[50%] bg-neutral-700" +
							" bg-neutral-700"
						}/>
						<div className={
							"absolute h-44 w-44 border border-neutral-900 rounded-full z-10 top-1/2" +
							" left-1/2 -translate-x-[50%] -translate-y-[50%] bg-neutral-700" +
							" bg-neutral-700"
						}/>
						<div className={
							"absolute h-36 w-36 border border-neutral-900 rounded-full z-10 top-1/2" +
							" left-1/2 -translate-x-[50%] -translate-y-[50%] bg-neutral-900"
						}/>
						<div className={
							"absolute h-full w-auto aspect-square bg-gradient-to-t z-10 rounded-full" +
							" from-neutral-200 via-neutral-900 to-neutral-200 mix-blend-multiply"
						}/>

						{/*Inner Circle*/}
						<div className={
							"absolute h-24 w-24 bg-white rounded-full z-10 top-1/2 left-1/2" +
							" -translate-x-[50%] -translate-y-[50%] overflow-hidden" +
							" group-hover:scale-[1.5] transition duration-150 ease-in-out"
						}>
							<Image
								src={songData?.albumImageUrl}
								alt={"bolt"}
								fill={true}
								className={"object-cover mix-blend-multiply opacity-[0.8]"}
							/>
						</div>
						{/*Numb*/}
						<div className={
							"absolute h-2 w-2 rounded-full z-10 top-1/2 left-1/2 -translate-x-[50%]" +
							" -translate-y-[50%] bg-gradient-to-t from-neutral-900 to-neutral-200"
						}/>
						{/*Numb Circle*/}
						<div className={
							"absolute h-8 w-8 border border-neutral-300 rounded-full z-10 top-1/2" +
							" left-1/2 -translate-x-[50%] -translate-y-[50%]"
						}/>


					</div>

				</Link>
			</div>
		);
	}


};