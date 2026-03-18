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
      image: "/lukeOG.jpg"
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
  }
];
