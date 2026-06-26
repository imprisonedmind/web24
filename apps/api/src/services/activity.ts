import { AsyncCache } from "../lib/cache";
import {
  listSyncedCodingDailyActivity,
  getSyncedHealthCurrentStats,
  listSyncedHealthDailyActivity,
  listSyncedReadingActivity,
  listSyncedGamingDailyActivity,
} from "../lib/convex";
import { getWatchDaysLastYear } from "./watched";

type ActivityDay = {
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

const STEP_SECONDS_PER_STEP = 0.6;
const MIN_STEP_ACTIVITY_SECONDS = 60;
const CATEGORY_LABELS: Record<string, string> = {
  Coding: "coding",
  "Writing Docs": "writing",
  Designing: "designing",
};

function mergeDays(...dayGroups: ActivityDay[][]) {
  const map: Record<string, ActivityDay> = {};

  for (const days of dayGroups) {
    for (const day of days) {
      if (!map[day.date]) {
        map[day.date] = {
          date: day.date,
          total: day.total,
          categories: Array.isArray(day.categories) ? [...day.categories] : []
        };
        continue;
      }

      map[day.date].total += day.total;
      for (const category of day.categories ?? []) {
        const existing = map[day.date].categories?.find(item => item.name === category.name);
        if (existing) {
          existing.total += category.total;
        } else {
          map[day.date].categories = [...(map[day.date].categories ?? []), category];
        }
      }
    }
  }

  const sortedKeys = Object.keys(map).sort();
  if (!sortedKeys.length) return [];

  const start = new Date(`${sortedKeys[0]}T00:00:00Z`);
  const end = new Date();
  const current = new Date(start);

  while (current <= end) {
    const iso = current.toISOString().slice(0, 10);
    if (!map[iso]) {
      map[iso] = { date: iso, total: 0, categories: [] };
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getCodingActivityDays(startDate?: string, endDate?: string) {
  return listSyncedCodingDailyActivity({ startDate, endDate });
}

export async function getHomeActivityDays(cookieHeader?: string | null, readingVersion?: string) {
  const sinceDate = new Date(Date.now() - 364 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);
  const [codingDays, watchDays, healthRows, readingActivity, gamingDays] = await Promise.all([
    getCodingActivityDays(sinceDate, endDate),
    getWatchDaysLastYear(cookieHeader),
    listSyncedHealthDailyActivity({ startDate: sinceDate, endDate }),
    listSyncedReadingActivity({ startDate: sinceDate, endDate, cacheVersion: readingVersion }),
    listSyncedGamingDailyActivity({ startDate: sinceDate, endDate }),
  ]);
  const exerciseDays = buildHealthSectionDays(healthRows, "exercise");
  const readingDays = buildReadingSectionDays(readingActivity.dailyActivity);

  return mergeDays(codingDays, watchDays, exerciseDays, readingDays, gamingDays);
}

export async function getHomeHeroHealthStats() {
  const current = await getSyncedHealthCurrentStats();

  return {
    heartRateBpm: current?.heartRateBpm ?? null,
    steps: current?.steps ?? null,
    date: current?.date ?? null,
  };
}

function mapDaysToCategory(days: ActivityDay[], category: string) {
  return days.map(day => {
    const match = day.categories?.find(cat => cat.name === category);
    const total = match?.total ?? 0;
    return {
      date: day.date,
      total,
      categories: match ? [{ name: match.name, total }] : []
    } satisfies ActivityDay;
  });
}

function sumTotals(days: { total: number }[]) {
  return days.reduce((acc, curr) => acc + (curr.total ?? 0), 0);
}

function fillActivityDateRange(rows: ActivityDay[], startDate: string, endDate: string) {
  const daysByDate = new Map(rows.map(row => [row.date, row]));
  const days: ActivityDay[] = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    days.push(daysByDate.get(date) ?? { date, total: 0, categories: [] });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function buildHealthSectionDays(
  rows: Awaited<ReturnType<typeof listSyncedHealthDailyActivity>>,
  kind: "exercise" | "sleep"
) {
  const sinceMs = Date.now() - 364 * 24 * 60 * 60 * 1000;
  const daysByDate = new Map<string, ActivityDay>();

  for (const row of rows) {
    const eventCategories = (row.activityCategories ?? [])
      .filter(category => category.kind === kind && category.total > 0)
      .map(({
        name,
        total,
        distanceMeters,
        steps,
        caloriesKcal,
        heartRateAvgBpm,
        heartRateMaxBpm,
      }) => ({
        name,
        total,
        kind,
        distanceMeters,
        steps,
        caloriesKcal,
        heartRateAvgBpm,
        heartRateMaxBpm,
      }));

    if (kind === "exercise") {
      const eventSeconds = eventCategories.reduce((total, category) => total + category.total, 0);
      const stepSeconds = Math.round(row.steps * STEP_SECONDS_PER_STEP);
      const categories = [...eventCategories];

      if (row.steps > 0 && stepSeconds >= MIN_STEP_ACTIVITY_SECONDS) {
        categories.push({
          name: "Steps",
          total: stepSeconds,
          kind,
          steps: row.steps,
          distanceMeters: row.distanceMeters > 0 ? row.distanceMeters : undefined,
          caloriesKcal: row.activeCaloriesKcal > 0 ? row.activeCaloriesKcal : undefined,
          heartRateAvgBpm: row.heartRateAvgBpm,
          heartRateMaxBpm: undefined,
        });
      }

      const total = eventSeconds + (categories.find(category => category.name === "Steps")?.total ?? 0);
      if (total <= 0) continue;

      daysByDate.set(row.date, {
        date: row.date,
        total,
        categories,
      });
      continue;
    }

    const total = row.sleepSeconds;
    if (total <= 0) continue;
    const fallbackCategoryName = "Sleep";
    daysByDate.set(row.date, {
      date: row.date,
      total,
      categories: eventCategories.length
        ? eventCategories
        : [{ name: fallbackCategoryName, total }]
    });
  }

  const days: ActivityDay[] = [];
  const cursor = new Date(sinceMs);
  const end = new Date();

  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    days.push(daysByDate.get(date) ?? { date, total: 0, categories: [] });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function buildReadingSectionDays(
  rows: Awaited<ReturnType<typeof listSyncedReadingActivity>>["dailyActivity"]
) {
  const sinceMs = Date.now() - 364 * 24 * 60 * 60 * 1000;
  const daysByDate = new Map<string, ActivityDay>();

  for (const row of rows) {
    if (row.totalReadingSeconds <= 0) continue;
    daysByDate.set(row.date, {
      date: row.date,
      total: row.totalReadingSeconds,
      categories: [
        {
          name: "Reading",
          total: row.totalReadingSeconds,
          wordsRead: row.totalWordsRead,
          bookCount: row.bookCount,
        },
      ],
    });
  }

  const days: ActivityDay[] = [];
  const cursor = new Date(sinceMs);
  const end = new Date();

  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    days.push(daysByDate.get(date) ?? { date, total: 0, categories: [] });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

export async function getWatchingActivityDays(cookieHeader?: string | null) {
  return getWatchDaysLastYear(cookieHeader);
}

export async function getWorkActivitySections() {
  const sinceDate = new Date(Date.now() - 364 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);
  const codingDays = await getCodingActivityDays(sinceDate, endDate);

  return Object.entries(CATEGORY_LABELS)
    .map(([sourceName, label]) => {
      const days = mapDaysToCategory(codingDays, sourceName);
      return { label, days, total: sumTotals(days) };
    })
    .filter(section => section.total > 0)
    .map(({ label, days }) => ({ label, days }));
}

export async function getHealthActivitySections() {
  const sinceDate = new Date(Date.now() - 364 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);
  const rows = await listSyncedHealthDailyActivity({ startDate: sinceDate, endDate });

  const sections = [
    { label: "exercise", days: buildHealthSectionDays(rows, "exercise") },
    { label: "sleep", days: buildHealthSectionDays(rows, "sleep") }
  ];

  return sections.filter(section => sumTotals(section.days) > 0);
}

export async function getReadingActivitySections(readingVersion?: string) {
  const sinceDate = new Date(Date.now() - 364 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);
  const activity = await listSyncedReadingActivity({ startDate: sinceDate, endDate, cacheVersion: readingVersion });
  const days = buildReadingSectionDays(activity.dailyActivity);

  return sumTotals(days) > 0 ? [{ label: "reading", days }] : [];
}

export async function getGamingActivitySections() {
  const sinceDate = new Date(Date.now() - 364 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);
  const days = fillActivityDateRange(
    await listSyncedGamingDailyActivity({ startDate: sinceDate, endDate }),
    sinceDate,
    endDate
  );
  return sumTotals(days) > 0 ? [{ label: "gaming", days }] : [];
}

export async function getFullActivityDays(cookieHeader?: string | null, readingVersion?: string) {
  const [watchingDays, workSections, healthSections, readingSections] = await Promise.all([
    getWatchingActivityDays(cookieHeader),
    getWorkActivitySections(),
    getHealthActivitySections(),
    getReadingActivitySections(readingVersion)
  ]);

  return {
    watchingDays,
    workSections,
    healthSections,
    readingSections
  };
}
