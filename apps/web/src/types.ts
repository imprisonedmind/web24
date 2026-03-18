export type WatchDay = {
  date: string;
  total: number;
  categories?: { name: string; total: number }[];
};

export type WatchedItem = {
  id: string;
  title: string;
  subtitle?: string;
  posterUrl: string;
  href: string;
  meta?: string;
};
