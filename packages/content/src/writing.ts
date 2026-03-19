export interface WritingPost {
  id: string;
  date: string;
  title: string;
  score?: number;
  openGraph: string;
  openGraphSmall: string;
  description: string;
}

const blogPosts: WritingPost[] = [
  {
    id: "30df90ec476b80c28b94d707420a91c5",
    date: "20 Feb 26",
    title: "how the f*ck do i build an alarm system",
    openGraph: "images/writing/iotLarge.jpg",
    openGraphSmall: "images/writing/iotSmall.jpg",
    description:
      "A raw DIY build log using ESP32, Raspberry Pi, MQTT, soldering, and AI to turn a wild idea into a working setup."
  },
  {
    id: "2a2f90ec476b80d486a0f03a58ef5bc8",
    date: "05 Nov 25",
    title: "protecting the mind against digital pollution",
    openGraph: "images/writing/tinLarge.jpg",
    openGraphSmall: "images/writing/tinSmall.jpg",
    description:
      "How I filter the web by a moral compass - blocking ads, feeds and autoplay across TV, YouTube and browsers with uBlock Origin, NextDNS, Stremio, Revanced."
  },
  {
    id: "20bf90ec476b806c9e76ce2c156e128c",
    date: "07 Jun 25",
    title: "how to host a dedicated classic offensive server",
    openGraph: "images/writing/classicLarge.jpg",
    openGraphSmall: "images/writing/classicSmall.jpg",
    description:
      "Learn how to host your own dedicated Classic Offensive server with this step-by-step guide. From installation and setup and server config, we cover everything you need to get your Classic Offensive (CS:CO) server online, visible, and ready for players. Perfect for modded CS:GO enthusiasts looking to run a stable, custom server."
  },
  {
    id: "14af90ec476b80d5b34deec12c0d0dc3",
    date: "26 Nov 24",
    title: "get olarm working with homekit & g-home",
    openGraph: "images/writing/olarm.jpg",
    openGraphSmall: "images/writing/olarmSmall.jpg",
    description:
      "Learn how to connect your Olarm communicator with HomeKit and Google Home using Homebridge. This step-by-step guide covers installation, plugin setup, and configuration to seamlessly integrate your Olarm alarm system with iOS and Android platforms."
  },
  {
    id: "d9d9ff0975444fa191bd2a5a2e102c91",
    date: "02 Aug 24",
    title: "fix external camera flicker on mac",
    openGraph: "images/writing/flicker.jpg",
    openGraphSmall: "images/writing/flickerSmall.jpg",
    description:
      "Learn how to fix external webcam flicker on Mac caused by fluorescent lighting. Discover an efficient solution using CameraController to adjust refresh rates without bloatware. Easy steps to improve your video quality."
  },
  {
    id: "c406c93858294ee2988bb757a978c18b",
    date: "04 Jul 24",
    title: "a love letter to raycast",
    openGraph: "images/writing/raycastLarge.jpg",
    openGraphSmall: "images/writing/raycastSmall.jpg",
    description:
      "Discover why Raycast is a must-have tool for efficient command management on your Mac. From window handling to Spotify controls and custom snippets, learn how Raycast transforms productivity. Explore key commands, window management tricks, and the power of personalized scripts. A must-read for those seeking seamless Mac navigation and advanced tool integration."
  },
  {
    id: "44b611cc9aba42aa838b6d7f7524ac18",
    date: "27 May 24",
    title: "watchQuery to save the day",
    openGraph: "images/writing/largeWatchQuery.jpg",
    openGraphSmall: "images/writing/smallWatchQuery.jpg",
    description:
      "In this blog post, the author delves into the implementation of Apollo GraphQL's `watchQuery()` to overcome skeleton loading across route navigation in a device management portal. They compare the currently implemented `useQuery()` method, which lacks caching and incurs loading delays, with the experimental `watchQuery()` approach that subscribes to cached data for faster interaction. The post outlines the pros and cons of `watchQuery()` implementation, discusses challenges like managing dependencies in `useEffect()`, and shares insights on stabilizing data sorting to reduce layout shifts in the user interface."
  },
  {
    id: "490b99e822bc41c88cdb02a370023821",
    date: "15 May 24",
    title: "next.js app server improvements",
    openGraph: "images/writing/speedLarge.jpg",
    openGraphSmall: "images/writing/speedSmall.jpg",
    description:
      "This post discusses significant improvements made to the Trinity website by changing how data fetching for blog posts and filtering of the data based on tags is done. Previously, data fetching was done inside a React Server Component (rsc) using URL slugs, which was slow. Now, data fetching is done in page.tsx, and data is passed as props, resulting in improvements. The changes involve calling getStoryData() once in page.tsx and using cached server data for subsequent calls, minimizing data fetching. Additional optimizations include prefetching and prioritizing certain links and images, reducing load time by roughly 75%. More investigation is needed, as Lighthouse scores do not reflect the improvements."
  },
  {
    id: "ebfc2f63277a40a9aeefe50a85fb2ea2",
    date: "21 Mar 24",
    title: "notion as a blog post provider",
    openGraph: "images/writing/notion.jpg",
    openGraphSmall: "images/writing/notionSmall.jpg",
    description:
      "Notion is used as a blog post creator/provider, leveraging react-notion-x for seamless integration with NextJS, offering real-time updates, auth handling, and efficient data storage in Supabase for optimal SEO with server-rendered metadata."
  },
  {
    id: "0e05c93cd6af475ea91c7abf74f8959d",
    date: "15 Feb 23",
    title: "revamping our mobile experience",
    openGraph: "images/writing/mobile.jpg",
    openGraphSmall: "images/writing/mobileSmall.jpg",
    description:
      "Revamping mobile app experience by optimizing screen space, reducing redundancy, following design principles like spacing consistency and visual hierarchy. Key changes: streamlined header, consolidated property info, expandable cards for actions, bottom navigation with icons, and better information architecture overall for improved usability."
  },
  {
    id: "9f7ca94172d546f6a98df201a2ff9042",
    date: "31 Oct 22",
    title: "device management unit interaction page redesign",
    openGraph: "images/writing/dashboard.jpg",
    openGraphSmall: "images/writing/dashboardSmall.jpg",
    description:
      "Redesigning the device management unit interaction page to optimize information architecture and visual hierarchy. Key changes: card/chip layout with heading text, icons, and descriptions to convey state quickly. Modular design for future expansions. Careful consideration of spacing, colors, editing UX. Ultimately, moving important info to the right for easy scanning, and separating main components side-by-side for reduced cognitive load following natural reading patterns. User testing validating initial design decisions after implementation."
  }
];

const reviewPosts: WritingPost[] = [
  {
    id: "4ef52f1563974088b57cd28617c8def8",
    date: "21 Aug 24",
    title: "wecrashed tv series (apple)",
    score: 3.5,
    openGraph: "images/writing/wecrashed.jpg",
    openGraphSmall: "images/writing/wecrashedSmalll.jpg",
    description:
      "The Neumans create a unicorn startup valued at $47 billion—a co-working space with a cult following rallying behind their ideology: elevating the world's consciousness."
  }
];

export const writingPosts: WritingPost[] = [...blogPosts, ...reviewPosts];

export function sortWritingPosts(posts: WritingPost[] = writingPosts) {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getTopWritingPosts(limit = 3) {
  return sortWritingPosts().slice(0, limit);
}

export function toWritingSlug(title: string) {
  return title.replace(/\s+/g, "-").toLowerCase();
}

export function getWritingRoutePath(post: WritingPost) {
  return `/writing/${toWritingSlug(post.title)}/${post.id}`;
}

export function getWritingPostById(id: string) {
  return writingPosts.find(post => post.id === id) ?? null;
}

export function getWritingPostBySlugParts(slug?: string, id?: string) {
  if (!id) return null;

  const post = getWritingPostById(id);
  if (!post) return null;

  if (slug && slug !== toWritingSlug(post.title)) {
    return null;
  }

  return post;
}

export function getWritingPrerenderRoutes() {
  return writingPosts.map(post => ({
    path: getWritingRoutePath(post),
    label: post.title,
    seo: {
      title: `${post.title} — Luke Stephens`,
      description: post.description,
      image: `/${post.openGraph}`
    }
  }));
}
