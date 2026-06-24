export type WatchDay = {
  date: string;
  total: number;
  categories?: {
    name: string;
    total: number;
    kind?: "exercise" | "sleep";
    distanceMeters?: number;
    steps?: number;
    caloriesKcal?: number;
    heartRateAvgBpm?: number;
    heartRateMaxBpm?: number;
    wordsRead?: number;
    bookCount?: number;
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

export type ReadingItem = {
  id: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  href: string;
  meta?: string;
};
