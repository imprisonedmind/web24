import { StaticImageData } from "next/image";
import trinity from "/public/trinitySmall.jpg";
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
import skuld from "/public/skuld.jpg";
import hyyp from "/public/hyyp.jpg";
import finchy from "/public/finchy.jpg";

export interface WorkCardData {
  title: string;
  link: string;
  tag: string;
  type: string;
  src: StaticImageData;
  alt: string;
  internal?: boolean;
  favourite?: boolean;
  description?: string;
  year?: string;
}

export const workData = (): WorkCardData[] => [
  {
    title: "hyyp+",
    link: "https://play.google.com/store/apps/details?id=za.trinity.com.chrysalisv2",
    tag: "mobile",
    type: "professional",
    src: hyyp,
    alt: "Home security system mobile app",
    favourite: true,
    description: "remote home security control & management",
    year: "2024",
  },
  {
    title: "finchy",
    link: "https://finchy-website.vercel.app/",
    tag: "mobile",
    type: "personal",
    src: finchy,
    alt: "mobile app for spend management",
    favourite: true,
    description: "local on device finance companion for capitec",
    year: "2025",
  },
  {
    title: "skuld-cli",
    link: "https://github.com/imprisonedmind/skuld",
    tag: "cli-tool",
    type: "personal",
    src: skuld,
    alt: "CLI tool for automatic Jira issue management",
    favourite: true,
    description: "command line tool for automatic Jira issue time tracking",
    year: "2025",
  },

  {
    title: "ootify.me",
    link: "https://ootify.me/",
    tag: "web addon",
    type: "personal",
    src: ootify,
    alt: "browser addon for AI virtual try on",
    favourite: true,
    description: "browser add for AI virtual try on",
    year: "2025",
  },
  {
    title: "olarm-ws",
    link: "https://github.com/imprisonedmind/homebridge-ws-olarm-plugin",
    tag: "plugin",
    type: "personal",
    src: olarm,
    alt: "bloggin website blog cover",
    description: "plugin bridging olarm system to homekit and google-home",
    year: "2024",
  },
  {
    title: "Trinity",
    link: "https://trinity.co.za",
    tag: "website",
    type: "professional",
    src: trinity,
    alt: "Trinity website cover image",
    favourite: true,
    description: "branding website for trinity",
    year: "2023",
  },
  {
    title: "sus.watch",
    link: "https://sus.watch",
    tag: "web app",
    type: "personal",
    src: susWatch,
    alt: "A device management portal",
    description: "online database of counter strike cheaters",
    year: "2025",
  },
  {
    title: "Portal",
    link: "/writing/device-management-portal/159f90ec476b8039a452c4675a6f24c6",
    tag: "web app",
    type: "professional",
    src: portal,
    alt: "A device management portal",
    internal: true,
    description: "Case study on building a secure device management portal",
    year: "2024",
  },
  {
    title: "PTTT",
    link: "https://parentingtheteentribe.com/",
    tag: "website / backend",
    type: "professional",
    src: pttt,
    alt: "A device management portal",
    description:
      "Educational site with subscription backend for parenting courses",
    year: "2021",
  },
  {
    title: "Giggity",
    link: "https://giggity.co.za",
    tag: "web app",
    type: "personal",
    src: giggity,
    alt: "Giggity.co.za website cover image",
    description: "Responsive brochure site for a South African geyser brand",
    year: "2021",
  },
  {
    title: "bloggin",
    link: "https://notion-nextjs-bloggin.vercel.app/home",
    tag: "web app",
    type: "personal",
    src: bloggin,
    alt: "bloggin website blog cover",
    description: "Headless Notion blog starter using Next.js and Notion API",
    year: "2021",
  },
  {
    title: "Postz",
    link: "https://metaversal-posts.vercel.app/",
    tag: "web app",
    type: "personal",
    src: postz,
    alt: "Postz website blog cover image",
    description: "Micro blog experiment for rapid-fire content publishing",
    year: "2021",
  },
  {
    title: "PitchPlatform",
    link: "https://takemyword-34623.web.app/",
    tag: "website",
    type: "professional",
    src: tmw,
    alt: "TakeMyWord website blog cover image",
    description:
      "Marketing site and admin console for a pitch coaching startup",
    year: "2020",
  },
  {
    title: "Specno",
    link: "https://specno-54db0.web.app",
    tag: "wesbite",
    type: "professional",
    src: specno,
    alt: "Specno.com website cover image",
    description: "Specno portfolio landing highlighting startup case studies",
    year: "2020",
  },
  {
    title: "portfolio",
    link: "https://luke-portfolio-64b54.web.app/",
    tag: "2020",
    type: "college",
    src: luke,
    alt: "Luke Stephens website cover image",
    description: "Final year portfolio showcasing interactive projects",
    year: "2020",
  },
  {
    title: "show-reel",
    link: "https://youtu.be/VRtpQDCGSvU",
    tag: "2020",
    type: "college",
    src: showreel,
    alt: "Luke Stephens 2020 show reel cover image",
    description: "Motion design reel produced during final year studies",
    year: "2020",
  },
  {
    title: "experiment",
    link: "https://experimental-website-96c14.web.app/",
    tag: "website",
    type: "college",
    src: experiment,
    alt: "Luke Stephens experimental website cover image",
    description: "Playground website exploring animation-heavy layouts",
    year: "2019",
  },
  {
    title: "blog",
    link: "https://lukestephens-2f9c9.web.app/home",
    tag: "2020",
    type: "college",
    src: blog,
    alt: "Luke Stephens 2020 blog cover image",
    description: "Personal blog CMS project built with Firebase",
    year: "2019",
  },
  {
    title: "game trailer",
    link: "https://youtu.be/NR02OtOpixo",
    tag: "2020",
    type: "college",
    src: acidMage,
    alt: "Luke Stephens 2020 blog cover image",
    description: "Trailer edit for the Acid Mage student game project",
    year: "2019",
  },
];
