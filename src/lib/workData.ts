import { StaticImageData } from "next/image";
import trinity from "/public/trinity.png";
import giggity from "/public/giggity2.png";
import specno from "/public/Spec.png";
import luke from "/public/luke.png";
import experiment from "/public/experiment.png";
import blog from "/public/blog.png";
import tmw from "/public/tmw.png";
import showreel from "/public/showreel.jpg";
import acidMage from "/public/acidMage.png";

export interface WorkCardData {
  title: string;
  link: string;
  tag: string;
  src: StaticImageData;
  alt: string;
}

export const workData = (): WorkCardData[] => [
  {
    title: "Trinity",
    link: "https://trinity.co.za",
    tag: "website",
    src: trinity,
    alt: "Trinity website cover image",
  },
  {
    title: "Giggity",
    link: "https://giggity.co.za",
    tag: "web app",
    src: giggity,
    alt: "Giggity.co.za website cover image",
  },
  {
    title: "PitchPlatform",
    link: "https://takemyword-34623.web.app/",
    tag: "website",
    src: tmw,
    alt: "TakeMyWord website blog cover image",
  },
  {
    title: "Specno",
    link: "https://specno-54db0.web.app",
    tag: "wesbite",
    src: specno,
    alt: "Specno.com website cover image",
  },
  {
    title: "portfolio",
    link: "https://luke-portfolio-64b54.web.app/",
    tag: "2020",
    src: luke,
    alt: "Luke Stephens website cover image",
  },
  {
    title: "show-reel",
    link: "https://youtu.be/VRtpQDCGSvU",
    tag: "2020",
    src: showreel,
    alt: "Luke Stephens 2020 show reel cover image",
  },
  {
    title: "experiment",
    link: "https://experimental-website-96c14.web.app/",
    tag: "website",
    src: experiment,
    alt: "Luke Stephens experimental website cover image",
  },
  {
    title: "blog",
    link: "https://lukestephens-2f9c9.web.app/home",
    tag: "2020",
    src: blog,
    alt: "Luke Stephens 2020 blog cover image",
  },
  {
    title: "game trailer",
    link: "https://youtu.be/NR02OtOpixo",
    tag: "2020",
    src: acidMage,
    alt: "Luke Stephens 2020 blog cover image",
  },
];
