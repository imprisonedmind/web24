import React from "react";

export default function Layout({children}: { children: React.ReactNode }) {
	return (
		<div className={`my-4`}>
			{children}
		</div>
	);
};