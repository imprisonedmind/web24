import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Config } from "tailwindcss";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const config: Config = {
  darkMode: ["class"],
  content: [
    path.join(rootDir, "apps/web/**/*.{js,ts,jsx,tsx,mdx,html}"),
    path.join(rootDir, "packages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(rootDir, "src/pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(rootDir, "src/components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(rootDir, "src/app/**/*.{js,ts,jsx,tsx,mdx}")
  ],
  theme: {
    screens: {
      xs: "426px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px"
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 6px)"
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))"
        }
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
