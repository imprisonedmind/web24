export interface AppItem {
  title: string;
  link: string;
  tag: string;
  image: string;
  previewImage: string;
  alt: string;
  logoFit?: "cover" | "contain";
  year?: string;
  internal?: boolean;
}

export const appItems: AppItem[] = [
  {
    title: "mooola",
    link: "https://mooola.co.za/",
    tag: "mobile",
    image: "/images/apps/logos/app-logo-512.png",
    previewImage: "https://mooola.co.za/assets/jpeg/mLarge.jpg",
    alt: "mooola spend management app logo",
    year: "2025",
  },
  {
    title: "Tomeio",
    link: "https://tomeio.app/",
    tag: "mobile app",
    image: "https://tomeio.app/logo.png",
    previewImage: "https://tomeio.app/assets/social/tomeio-large.jpg",
    alt: "Tomeio book discovery app logo",
    year: "2026",
  },
  {
    title: "Paymatey",
    link: "https://paymatey.net/",
    tag: "mobile app",
    image: "/images/apps/logos/logo_prod.jpeg",
    previewImage: "/images/apps/previews/paymatey2.png",
    alt: "Paymatey app logo",
    year: "2026",
  },
  {
    title: "yapboard",
    link: "https://yapboard.app/",
    tag: "mobile app",
    image: "/images/apps/logos/yapboard.jpg",
    previewImage: "/images/apps/previews/yapboard.jpg",
    alt: "yapboard app logo",
    year: "2026",
  },
  {
    title: "Notepond",
    link: "https://notepond.app",
    tag: "macOS app",
    image: "/images/apps/logos/notepond.png",
    previewImage: "https://notepond.app/og_1200x630.png",
    alt: "Notepond app logo",
    year: "2026",
  },
];
