export interface WorkItem {
  title: string;
  link: string;
  tag: string;
  type: string;
  image: string;
  alt: string;
  internal?: boolean;
  favourite?: boolean;
  description?: string;
  year?: string;
}

export const workItems: WorkItem[] = [
  {
    title: "hyyp+",
    link: "https://play.google.com/store/apps/details?id=za.trinity.com.chrysalisv2",
    tag: "mobile",
    type: "professional",
    image: "/hyyp.jpg",
    alt: "Home security system mobile app",
    favourite: true,
    description: "remote home security control & management",
    year: "2024"
  },
  {
    title: "finchy",
    link: "https://finchy-website.vercel.app/",
    tag: "mobile",
    type: "personal",
    image: "/finchy.jpg",
    alt: "mobile app for spend management",
    favourite: true,
    description: "local on device finance companion for capitec",
    year: "2025"
  },
  {
    title: "skuld-cli",
    link: "https://github.com/imprisonedmind/skuld",
    tag: "cli-tool",
    type: "personal",
    image: "/skuld.jpg",
    alt: "CLI tool for automatic Jira issue management",
    favourite: true,
    description: "command line tool for automatic Jira issue time tracking",
    year: "2025"
  },
  {
    title: "ootify.me",
    link: "https://ootify.me/",
    tag: "web addon",
    type: "personal",
    image: "/ootify.jpg",
    alt: "browser addon for AI virtual try on",
    favourite: true,
    description: "browser addon for AI virtual try on",
    year: "2025"
  },
  {
    title: "olarm-ws",
    link: "https://github.com/imprisonedmind/homebridge-ws-olarm-plugin",
    tag: "plugin",
    type: "personal",
    image: "/olarmHero.jpg",
    alt: "Olarm home automation plugin cover",
    description: "plugin bridging olarm system to homekit and google-home",
    year: "2024"
  },
  {
    title: "Trinity",
    link: "https://trinity.co.za",
    tag: "website",
    type: "professional",
    image: "/trinitySmall.jpg",
    alt: "Trinity website cover image",
    favourite: true,
    description: "branding website for trinity",
    year: "2023"
  },
  {
    title: "sus.watch",
    link: "https://sus.watch",
    tag: "web app",
    type: "personal",
    image: "/sus_watch.jpg",
    alt: "A device management portal",
    description: "online database of counter strike cheaters",
    year: "2025"
  },
  {
    title: "Portal",
    link: "/writing/device-management-portal/159f90ec476b8039a452c4675a6f24c6",
    tag: "web app",
    type: "professional",
    image: "/projects/portal.png",
    alt: "A device management portal",
    internal: true,
    description: "Case study on building a secure device management portal",
    year: "2024"
  },
  {
    title: "PTTT",
    link: "https://parentingtheteentribe.com/",
    tag: "website / backend",
    type: "professional",
    image: "/pttt.jpg",
    alt: "Educational subscription platform cover",
    description: "Educational site with subscription backend for parenting courses",
    year: "2021"
  },
  {
    title: "Giggity",
    link: "https://giggity.co.za",
    tag: "web app",
    type: "personal",
    image: "/giggity2.png",
    alt: "Giggity.co.za website cover image",
    description: "Responsive brochure site for a South African geyser brand",
    year: "2021"
  },
  {
    title: "bloggin",
    link: "https://notion-nextjs-bloggin.vercel.app/home",
    tag: "web app",
    type: "personal",
    image: "/bloggin.png",
    alt: "bloggin website blog cover",
    description: "Headless Notion blog starter using Next.js and Notion API",
    year: "2021"
  },
  {
    title: "Postz",
    link: "https://metaversal-posts.vercel.app/",
    tag: "web app",
    type: "personal",
    image: "/postz.jpg",
    alt: "Postz website blog cover image",
    description: "Micro blog experiment for rapid-fire content publishing",
    year: "2021"
  },
  {
    title: "PitchPlatform",
    link: "https://takemyword-34623.web.app/",
    tag: "website",
    type: "professional",
    image: "/tmw.png",
    alt: "TakeMyWord website cover image",
    description: "Marketing site and admin console for a pitch coaching startup",
    year: "2020"
  },
  {
    title: "Specno",
    link: "https://specno-54db0.web.app",
    tag: "website",
    type: "professional",
    image: "/spec.png",
    alt: "Specno.com website cover image",
    description: "Specno portfolio landing highlighting startup case studies",
    year: "2020"
  },
  {
    title: "portfolio",
    link: "https://luke-portfolio-64b54.web.app/",
    tag: "2020",
    type: "college",
    image: "/luke.png",
    alt: "Luke Stephens website cover image",
    description: "Final year portfolio showcasing interactive projects",
    year: "2020"
  },
  {
    title: "show-reel",
    link: "https://youtu.be/VRtpQDCGSvU",
    tag: "2020",
    type: "college",
    image: "/showreel.jpg",
    alt: "Luke Stephens 2020 show reel cover image",
    description: "Motion design reel produced during final year studies",
    year: "2020"
  },
  {
    title: "experiment",
    link: "https://experimental-website-96c14.web.app/",
    tag: "website",
    type: "college",
    image: "/experiment.png",
    alt: "Luke Stephens experimental website cover image",
    description: "Playground website exploring animation-heavy layouts",
    year: "2019"
  },
  {
    title: "blog",
    link: "https://lukestephens-2f9c9.web.app/home",
    tag: "2020",
    type: "college",
    image: "/blog.png",
    alt: "Luke Stephens 2020 blog cover image",
    description: "Personal blog CMS project built with Firebase",
    year: "2019"
  },
  {
    title: "game trailer",
    link: "https://youtu.be/NR02OtOpixo",
    tag: "2020",
    type: "college",
    image: "/acidMage.png",
    alt: "Luke Stephens 2020 game trailer cover image",
    description: "Trailer edit for the Acid Mage student game project",
    year: "2019"
  }
];

export function getFeaturedWorkItems(limit = 6) {
  const favourites = workItems.filter(item => item.favourite);
  return (favourites.length ? favourites : workItems).slice(0, limit);
}
