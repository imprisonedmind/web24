export type WatchDay = {
  date: string;
  total: number;
  categories?: { name: string; total: number }[];
};
