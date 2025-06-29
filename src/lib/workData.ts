import { StaticImageData } from "next/image";
import trinity from "/public/trinity.jpg";
import portal from "/public/projects/portal.png";
import giggity from "/public/giggity2.png";
import specno from "/public/Spec.png";
import luke from "/public/luke.png";
import experiment from "/public/experiment.png";
import blog from "/public/blog.png";
import tmw from "/public/tmw.png";
import postz from "/public/postz.jpg";
import showreel from "/public/showreel.jpg";
import acidMage from "/public/acidMage.png";
import bloggin from "/public/bloggin.png";
import olarm from "/public/olarmHero.jpg";
import pttt from "/public/pttt.jpg";
import susWatch from "/public/sus_watch.jpg";
import ootify from "/public/ootify.jpg";
import hyyp from "/public/hyyp.jpg";

export interface WorkCardData {
  title: string;
  link: string;
  tag: string;
  type: string;
  src: StaticImageData;
  alt: string;
  internal?: boolean;
}

export const workData = (): WorkCardData[] => [
  {
    title: "hyyp+",
    link: "https://play.google.com/store/apps/details?id=za.trinity.com.chrysalisv2",
    tag: "mobile app",
    type: "professional",
    src: hyyp,
    alt: "Home security system mobile app",
  },
  {
    title: "ootify.me",
    link: "https://ootify.me",
    tag: "web app",
    type: "personal",
    src: ootify,
    alt: "A device management portal",
    internal: true
  },
  {
    title: "Trinity",
    link: "https://trinity.co.za",
    tag: "website",
    type: "professional",
    src: trinity,
    alt: "Trinity website cover image"
  },
  {
    title: "sus.watch",
    link: "https://sus.watch",
    tag: "web app",
    type: "personal",
    src: susWatch,
    alt: "A device management portal",
  },
  {
    title: "olarm-ws",
    link: "https://github.com/imprisonedmind/homebridge-ws-olarm-plugin",
    tag: "plugin",
    type: "personal",
    src: olarm,
    alt: "bloggin website blog cover"
  },
  {
    title: "Portal",
    link: "/writing/device-management-portal/159f90ec476b8039a452c4675a6f24c6",
    tag: "web app",
    type: "professional",
    src: portal,
    alt: "A device management portal",
    internal: true
  },
  {
    title: "PTTT",
    link: "https://parentingtheteentribe.com/",
    tag: "website / backend",
    type: "professional",
    src: pttt,
    alt: "A device management portal"
  },
  {
    title: "Giggity",
    link: "https://giggity.co.za",
    tag: "web app",
    type: "personal",
    src: giggity,
    alt: "Giggity.co.za website cover image"
  },
  {
    title: "bloggin",
    link: "https://notion-nextjs-bloggin.vercel.app/home",
    tag: "web app",
    type: "personal",
    src: bloggin,
    alt: "bloggin website blog cover"
  },
  {
    title: "Postz",
    link: "https://metaversal-posts.vercel.app/",
    tag: "web app",
    type: "personal",
    src: postz,
    alt: "Postz website blog cover image"
  },
  {
    title: "PitchPlatform",
    link: "https://takemyword-34623.web.app/",
    tag: "website",
    type: "professional",
    src: tmw,
    alt: "TakeMyWord website blog cover image"
  },
  {
    title: "Specno",
    link: "https://specno-54db0.web.app",
    tag: "wesbite",
    type: "professional",
    src: specno,
    alt: "Specno.com website cover image"
  },
  {
    title: "portfolio",
    link: "https://luke-portfolio-64b54.web.app/",
    tag: "2020",
    type: "college",
    src: luke,
    alt: "Luke Stephens website cover image"
  },
  {
    title: "show-reel",
    link: "https://youtu.be/VRtpQDCGSvU",
    tag: "2020",
    type: "college",
    src: showreel,
    alt: "Luke Stephens 2020 show reel cover image"
  },
  {
    title: "experiment",
    link: "https://experimental-website-96c14.web.app/",
    tag: "website",
    type: "college",
    src: experiment,
    alt: "Luke Stephens experimental website cover image"
  },
  {
    title: "blog",
    link: "https://lukestephens-2f9c9.web.app/home",
    tag: "2020",
    type: "college",
    src: blog,
    alt: "Luke Stephens 2020 blog cover image"
  },
  {
    title: "game trailer",
    link: "https://youtu.be/NR02OtOpixo",
    tag: "2020",
    type: "college",
    src: acidMage,
    alt: "Luke Stephens 2020 blog cover image"
  }
];
