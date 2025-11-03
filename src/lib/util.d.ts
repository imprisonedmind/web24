import type { songData } from "./types";

export interface CategoryTotal {
  name: string;
  total: number;
}

export interface ActivityDay {
  date: string;
  total: number;
  categories?: CategoryTotal[];
}

export interface SpotifyRangeOptions {
  startDate?: string;
  endDate?: string;
  days?: number;
  maxDays?: number;
}

export declare function spaceToHyphen(value?: string | null): string;

export declare function getTopThreePosts<T extends { date: string }>(posts: T[]): T[];

export declare function chunkArray<T extends { date: string; total: number }>(
  array: T[],
  chunkSize: number
): T[][];

export declare function formatDate(date: string): string;

export declare function getSpotifyRecentDays(
  range?: number | SpotifyRangeOptions
): Promise<ActivityDay[]>;

export declare function returnSongData(requireTrack?: boolean): Promise<songData | null>;
