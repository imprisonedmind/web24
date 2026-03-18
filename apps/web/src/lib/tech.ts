export const techItems = [
  { label: "Next.js", href: "https://nextjs.org/", src: "/logos/Nextjs-logo.svg", tag: "web" },
  { label: "Vite", href: "https://vite.dev/", src: "/logos/Vite_Logo_2026.svg", tag: "build" },
  { label: "Convex", href: "https://www.convex.dev/", src: "/logos/logo-color.svg", tag: "backend" },
  { label: "Tauri", href: "https://tauri.app/", src: "/logos/TauriAppLogo.svg", tag: "desktop" },
  { label: "Django", href: "https://www.djangoproject.com/", src: "/logos/Django_logo.svg", tag: "backend" },
  { label: "Supabase", href: "https://supabase.com", src: "/logos/supabase-logo-wordmark--light.svg", tag: "backend" },
  { label: "Firebase", href: "https://firebase.google.com/", src: "/logos/New_Firebase_logo.svg", tag: "backend" },
  { label: "React Native", href: "https://reactnative.dev/", src: "/logos/React-icon.svg", tag: "mobile" },
  { label: "Flutter", href: "https://flutter.dev/", src: "/logos/Google-flutter-logo.svg", tag: "mobile" },
  { label: "MongoDB", href: "https://www.mongodb.com/", src: "/logos/MongoDB_Logo.svg", tag: "database" },
  { label: "Postgres", href: "https://www.postgresql.org/", src: "/logos/Postgresql_elephant.svg", tag: "database" },
  { label: "OpenAI", href: "https://openai.com/", src: "/logos/OpenAI_Logo.svg", tag: "ai" },
  { label: "Tailwind", href: "https://tailwindcss.com/", src: "/logos/Tailwind_CSS_logo_with_dark_text.svg", tag: "css" },
  { label: "Figma", href: "https://www.figma.com/", src: "/logos/Figma-logo.svg", tag: "design" },
] as const;

const tagOrder = [
  "web",
  "build",
  "backend",
  "database",
  "mobile",
  "desktop",
  "ai",
  "css",
  "design",
] as const;

const tagRank = new Map(tagOrder.map((tag, index) => [tag, index]));

export const orderedTechItems = [...techItems].sort((left, right) => {
  const leftRank = tagRank.get(left.tag) ?? Number.MAX_SAFE_INTEGER;
  const rightRank = tagRank.get(right.tag) ?? Number.MAX_SAFE_INTEGER;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return left.label.localeCompare(right.label);
});
