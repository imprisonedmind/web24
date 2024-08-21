import React from "react";
import type {Metadata} from "next";

export default function Layout({children}: { children: React.ReactNode }) {
	return (
		<div className={`my-4`}>
			{children}
		</div>
	);
};
