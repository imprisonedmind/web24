import React, { FC } from "react";

interface LoadingWrapperProps {
	children: React.ReactNode;
}

export const LoadingWrapper: FC<LoadingWrapperProps> = (props) => {
	const { children } = props;

	return (
		<div
			className={`
        h-[100vh] mx-auto flex w-full max-w-[600px] flex-col items-center justify-center 
        gap-8 p-4 px-2 py-16 md:px-80
    `}
		>
			{children}
		</div>
	);
};
