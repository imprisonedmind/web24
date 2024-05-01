"use client"
import {useRouter} from "next/navigation";

export default function GoBack() {
	const router = useRouter()

	return (
		<p className={"cursor-pointer"} onClick={() => router.back()}>back</p>
	);
};