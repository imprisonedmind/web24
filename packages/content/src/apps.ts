export interface AppItem {
  title: string;
  link: string;
  tag: string;
  image: string;
  previewImage: string;
  alt: string;
  year?: string;
  internal?: boolean;
}

export const appItems: AppItem[] = [
  {
    title: "Paymatey",
    link: "https://paymatey.net/",
    tag: "mobile app",
    image: "/app-logos/logo_prod.jpeg",
    previewImage: "/paymatey2.png",
    alt: "Paymatey app logo",
    year: "2026",
  },
  {
    title: "yapboard",
    link: "https://yapboard.app/",
    tag: "mobile app",
    image: "/app-logos/yapboard.jpg",
    previewImage: "/yapboard.jpg",
    alt: "yapboard app logo",
    year: "2026",
  },
  {
    title: "finchy",
    link: "https://finchy-website.vercel.app/",
    tag: "mobile",
    image: "/app-logos/finchy.jpg",
    previewImage: "/finchy.jpg",
    alt: "mobile app for spend management",
    year: "2025",
  },
];
