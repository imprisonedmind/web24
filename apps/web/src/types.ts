export type WatchDay = {
  date: string;
  total: number;
  categories?: {
    name: string;
    total: number;
    distanceMeters?: number;
    steps?: number;
    caloriesKcal?: number;
    heartRateAvgBpm?: number;
    heartRateMaxBpm?: number;
  }[];
};

export type WatchedItem = {
  id: string;
  title: string;
  subtitle?: string;
  posterUrl: string;
  href: string;
  meta?: string;
};
