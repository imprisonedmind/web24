import React, { FC } from "react";

interface LoadingWrapperProps {
	children: any;
}

export const LoadingWrapper: FC<LoadingWrapperProps> = (props) => {
	const { children } = props;

	return (
		<div
			className={`
        mx-auto flex w-full flex-col items-center justify-center 
        gap-8 p-4 px-2 py-16 max-w-[720px]
    `}
		>
			{children}
		</div>
	);
};
