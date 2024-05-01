import {StaticImageData} from "next/image";
import trinity from "/public/trinity.png";
import giggity from "/public/giggity2.png";
import specno from "/public/spec.png";
import luke from "/public/luke.png";
import experiment from "/public/experiment.png";
import blog from "/public/blog.png";
import tmw from "/public/tmw.png";

export interface WorkCardData {
	title: string;
	link: string;
	tag: string;
	src: StaticImageData;
	alt: string;
}

export const workData = (): WorkCardData[] => [
	{
		title: "Trinity Telecomm",
		link: "https://trinity.co.za",
		tag: "website",
		src: trinity,
		alt: "Trinity website cover image"
	},
	{
		title: "Giggity",
		link: "https://giggity.co.za",
		tag: "web app",
		src: giggity,
		alt: "Giggity.co.za website cover image"
	},
	{
		title: "Take My Word",
		link: "https://takemyword-34623.web.app/",
		tag: "website",
		src: tmw,
		alt: "TakeMyWord website blog cover image"
	},
	{
		title: "Specno",
		link: "https://specno-54db0.web.app",
		tag: "wesbite",
		src: specno,
		alt: "Specno.com website cover image"
	},
	{
		title: "Portfolio",
		link: "https://luke-portfolio-64b54.web.app/",
		tag: "2020",
		src: luke,
		alt: "Luke Stephens website cover image"
	},
	{
		title: "Experiment",
		link: "https://experimental-website-96c14.web.app/",
		tag: "website",
		src: experiment,
		alt: "Luke Stephens experimental website cover image"
	},
	{
		title: "blog",
		link: "https://lukestephens-2f9c9.web.app/home",
		tag: "2020",
		src: blog,
		alt: "Luke Stephens 2020 blog cover image"
	}
];