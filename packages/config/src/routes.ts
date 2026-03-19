export type PublicRoute = {
  path: string;
  label: string;
  seo: {
    title: string;
    description: string;
    image?: string;
  };
};

export const publicRoutes: PublicRoute[] = [
  {
    path: "/",
    label: "Home",
    seo: {
      title: "Luke Stephens — software designer",
      description:
        "Personal site of Luke Stephens featuring work, activity, and the latest writing, music, and television tracking.",
      image: "/images/profile/lukeOG.jpg"
    }
  },
  {
    path: "/work",
    label: "Work",
    seo: {
      title: "Work — Luke Stephens",
      description:
        "Selected software, design, and product work by Luke Stephens."
    }
  },
  {
    path: "/writing",
    label: "Writing",
    seo: {
      title: "Writing — Luke Stephens",
      description:
        "Writing, reviews, and case studies collected for prerendered SEO-friendly publishing."
    }
  },
  {
    path: "/activity",
    label: "Activity",
    seo: {
      title: "Activity — Luke Stephens",
      description:
        "Recent watching and media activity presented in a prerendered shell with live API hydration."
    }
  },
  {
    path: "/watched",
    label: "Watched",
    seo: {
      title: "Watched — Luke Stephens",
      description:
        "Television and movie tracking views backed by the new Hono API."
    }
  },
  {
    path: "/watched/recent",
    label: "Recently Watched",
    seo: {
      title: "Recently Watched — Luke Stephens",
      description:
        "Recent television and movie watching activity by Luke Stephens."
    }
  },
  {
    path: "/watched/month",
    label: "Most Watched This Month",
    seo: {
      title: "Most Watched This Month — Luke Stephens",
      description:
        "Monthly television and movie watching stats and rankings by Luke Stephens."
    }
  },
  {
    path: "/watched/all-time",
    label: "Most Watched All Time",
    seo: {
      title: "Most Watched All Time — Luke Stephens",
      description:
        "All-time television and movie watching stats and rankings by Luke Stephens."
    }
  },
  {
    path: "/watched/months",
    label: "Watched by Month",
    seo: {
      title: "Watched by Month — Luke Stephens",
      description:
        "Monthly archive of television and movie watching activity by Luke Stephens."
    }
  },
  {
    path: "/tech",
    label: "Tech",
    seo: {
      title: "Tech — Luke Stephens",
      description:
        "Tools, frameworks, and technology used by Luke Stephens."
    }
  }
];
