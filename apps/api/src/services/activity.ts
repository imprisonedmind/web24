import { AsyncCache } from "../lib/cache";
import { getSyncedHealthCurrentStats, listSyncedHealthDailyActivity } from "../lib/convex";
import { getWatchDaysLastYear } from "./watched";

type ActivityDay = {
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

const WAKATIME_SHARE_URL =
  "https://wakatime.com/share/@018c620c-4d0b-4835-a919-aefff3d87af2/c68e7bc4-65b4-4421-914f-3e1e404c199d.json";
const WAKATIME_TTL_MS = 60 * 60 * 1000;
const WAKATIME_STALE_MS = 6 * 60 * 60 * 1000;
const codingActivityCache = new AsyncCache<ActivityDay[]>();
const STEP_SECONDS_PER_STEP = 0.6;
const MIN_STEP_ACTIVITY_SECONDS = 60;
const CATEGORY_LABELS: Record<string, string> = {
  Coding: "coding",
  "Writing Docs": "writing",
  Designing: "designing",
};

function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase() === "ai coding" ? "Coding" : name;
}

function normalizeWakaDay(day: ActivityDay) {
  const categoryTotals = new Map<string, number>();

  for (const category of day.categories ?? []) {
    const name = normalizeCategoryName(category.name);
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + category.total);
  }

  return {
    ...day,
    categories: Array.from(categoryTotals, ([name, total]) => ({ name, total }))
  } satisfies ActivityDay;
}

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

export async function getCodingActivityDays() {
  return codingActivityCache.getOrRefresh({
    key: "wakatime:coding-days",
    ttlMs: WAKATIME_TTL_MS,
    staleWhileRevalidateMs: WAKATIME_STALE_MS,
    loader: async () => {
      try {
        const response = await fetch(WAKATIME_SHARE_URL, {
          headers: {
            dataType: "jsonp"
          }
        });

        if (!response.ok) {
          console.warn(`[api/activity] wakatime request failed (${response.status})`);
          return [] as ActivityDay[];
        }

        const payload = (await response.json()) as { days?: ActivityDay[] } | null;
        const todayIso = new Date().toISOString().split("T")[0];

        return Array.isArray(payload?.days)
          ? payload.days
              .filter(day => day?.date && day.date <= todayIso)
              .map(normalizeWakaDay)
          : [];
      } catch (error) {
        console.error("[api/activity] failed to fetch wakatime activity", error);
        return [] as ActivityDay[];
      }
    }
  });
}

export async function getHomeActivityDays(cookieHeader?: string | null) {
  const sinceDate = new Date(Date.now() - 364 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);
  const [codingDays, watchDays, healthRows] = await Promise.all([
    getCodingActivityDays(),
    getWatchDaysLastYear(cookieHeader),
    listSyncedHealthDailyActivity({ startDate: sinceDate, endDate })
  ]);
  const exerciseDays = buildHealthSectionDays(healthRows, "exercise");

  return mergeDays(codingDays, watchDays, exerciseDays);
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
        distanceMeters,
        steps,
        caloriesKcal,
        heartRateAvgBpm,
        heartRateMaxBpm,
      }));

    if (kind === "exercise") {
      const eventSeconds = eventCategories.reduce((total, category) => total + category.total, 0);
      const eventSteps = eventCategories.reduce((total, category) => total + (category.steps ?? 0), 0);
      const eventDistanceMeters = eventCategories.reduce((total, category) => total + (category.distanceMeters ?? 0), 0);
      const eventCaloriesKcal = eventCategories.reduce((total, category) => total + (category.caloriesKcal ?? 0), 0);
      const remainingSteps = Math.max(row.steps - eventSteps, 0);
      const remainingDistanceMeters = Math.max(row.distanceMeters - eventDistanceMeters, 0);
      const remainingCaloriesKcal = Math.max(row.activeCaloriesKcal - eventCaloriesKcal, 0);
      const stepSeconds = Math.round(remainingSteps * STEP_SECONDS_PER_STEP);
      const categories = [...eventCategories];

      if (remainingSteps > 0 && stepSeconds >= MIN_STEP_ACTIVITY_SECONDS) {
        categories.push({
          name: "Steps",
          total: stepSeconds,
          steps: remainingSteps,
          distanceMeters: remainingDistanceMeters > 0 ? remainingDistanceMeters : undefined,
          caloriesKcal: remainingCaloriesKcal > 0 ? remainingCaloriesKcal : undefined,
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

export async function getWatchingActivityDays(cookieHeader?: string | null) {
  return getWatchDaysLastYear(cookieHeader);
}

export async function getWorkActivitySections() {
  const codingDays = await getCodingActivityDays();

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

export async function getFullActivityDays(cookieHeader?: string | null) {
  const [watchingDays, workSections, healthSections] = await Promise.all([
    getWatchingActivityDays(cookieHeader),
    getWorkActivitySections(),
    getHealthActivitySections()
  ]);

  return {
    watchingDays,
    workSections,
    healthSections
  };
}
