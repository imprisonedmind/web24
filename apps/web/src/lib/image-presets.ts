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
  widths?: number[];
  sizes?: string;
  fetchPriority?: "high" | "low" | "auto";
};

export const imagePresets: Record<ImagePresetName, ImagePreset> = {
  heroPortrait: {
    width: 640,
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
    widths: [96, 192],
    sizes: "82px",
  },
  appPreview: {
    widths: [220, 440],
    sizes: "220px",
  },
  locationMap: {
    widths: [320, 640, 960],
    sizes: "(max-width: 640px) 100vw, 33vw",
  },
  techLogo: {
    widths: [120, 240],
    sizes: "104px",
    fit: "contain",
  },
  musicArtwork: {
    widths: [96, 192],
    sizes: "96px",
  },
};
