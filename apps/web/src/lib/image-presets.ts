import type { CfImageOptions } from "./cf-image";

export type ImagePresetName =
  | "heroPortrait"
  | "workCard"
  | "writingCard"
  | "catalogWork"
  | "previewCard"
  | "appLogo"
  | "appPreview"
  | "locationMap"
  | "techLogo"
  | "musicArtwork";

export type ImagePreset = CfImageOptions & {
  height?: number;
  widths?: number[];
  sizes?: string;
  fetchPriority?: "high" | "low" | "auto";
};

export const imagePresets: Record<ImagePresetName, ImagePreset> = {
  heroPortrait: {
    width: 640,
    height: 853,
    widths: [320, 480, 640],
    sizes: "300px",
    fetchPriority: "high",
  },
  workCard: {
    widths: [240, 370],
    sizes: "185px",
  },
  writingCard: {
    widths: [320, 640, 960],
    sizes: "(max-width: 768px) 100vw, 640px",
  },
  catalogWork: {
    widths: [320, 640, 960],
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  },
  previewCard: {
    widths: [360, 720],
    sizes: "360px",
  },
  appLogo: {
    width: 82,
    height: 82,
    widths: [96, 192],
    sizes: "82px",
  },
  appPreview: {
    width: 220,
    height: 176,
    widths: [220, 440],
    sizes: "220px",
  },
  locationMap: {
    width: 640,
    height: 485,
    widths: [320, 480, 640, 828],
    sizes: "(max-width: 640px) 100vw, 33vw",
  },
  techLogo: {
    width: 104,
    height: 40,
    widths: [120, 240],
    sizes: "104px",
    fit: "contain",
  },
  musicArtwork: {
    width: 96,
    height: 96,
    widths: [96, 192],
    sizes: "96px",
  },
};
