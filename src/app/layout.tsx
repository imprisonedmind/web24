import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
// core styles shared by all of react-notion-x (required)
import 'react-notion-x/src/styles.css'

// used for code syntax highlighting (optional)
import 'prismjs/themes/prism-tomorrow.css'

// used for rendering equations (optional)
import 'katex/dist/katex.min.css'

const inter = Inter({subsets: ["latin"]});


export default function RootLayout({children,}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
		<head>
			<link rel="icon" href="/faviconX167.svg" sizes="any"/>
		</head>
		<body className={inter.className}>{children}</body>
		</html>
	);
}

export const metadata: Metadata = {
	title: "Luke Stephens",
	description: `an individual, software designer, currently working at Trinity Telecomm (PTY) LTD`,
	openGraph: {
		type: "website",
		url: "https://lukestephens.co.za",
		title: "Luke Stephens",
		description: "an individual, type-4 enneagram, passionate, dedicated, resilient.",
		siteName: "Luke Stephens",
		images: "https://lukestephens.co.za/luke2.jpg"
	},
	twitter: {
		card: "summary_large_image",
		site: "@site",
		creator: "@lukey_stephens",
		"images": "https://lukestephens.co.za/luke2.jpg"
	}
};




