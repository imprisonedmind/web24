import {LoadingWrapper} from "@/components/wrapper/loadingWrapper";

export default function Loading() {
	return (
		<LoadingWrapper>
			<div
				className={
					"h-10 w-3/5 animate-pulse self-start rounded-sm bg-neutral-200/60"
				}
			/>
			<div
				className={"h-64 w-full animate-pulse rounded-md bg-neutral-200/60"}
			/>
			<div
				className={"h-32 w-full animate-pulse rounded-md bg-neutral-200/60"}
			/>
			<div
				className={"h-80 w-full animate-pulse rounded-md bg-neutral-200/60"}
			/>
			<div
				className={"h-80 w-full animate-pulse rounded-md bg-neutral-200/60"}
			/>
		</LoadingWrapper>
	);
}
