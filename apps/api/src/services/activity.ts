import { AsyncCache } from "../lib/cache";
import { getWatchDaysLastYear } from "./watched";

type ActivityDay = {
  date: string;
  total: number;
  categories?: { name: string; total: number }[];
};

const WAKATIME_SHARE_URL =
  "https://wakatime.com/share/@018c620c-4d0b-4835-a919-aefff3d87af2/c68e7bc4-65b4-4421-914f-3e1e404c199d.json";
const WAKATIME_TTL_MS = 60 * 60 * 1000;
const WAKATIME_STALE_MS = 6 * 60 * 60 * 1000;
const codingActivityCache = new AsyncCache<ActivityDay[]>();
const CATEGORY_LABELS: Record<string, string> = {
  Coding: "coding",
  "Writing Docs": "writing",
  Designing: "designing",
  Meeting: "meeting",
  Browsing: "browsing"
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

function mergeDays(wakaDays: ActivityDay[], traktDays: ActivityDay[]) {
  const map: Record<string, ActivityDay> = {};

  for (const day of wakaDays) {
    map[day.date] = {
      date: day.date,
      total: day.total,
      categories: Array.isArray(day.categories) ? [...day.categories] : []
    };
  }

  for (const day of traktDays) {
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
  const [codingDays, watchDays] = await Promise.all([
    getCodingActivityDays(),
    getWatchDaysLastYear(cookieHeader)
  ]);

  return mergeDays(codingDays, watchDays);
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

export async function getFullActivityDays(cookieHeader?: string | null) {
  const [watchingDays, workSections] = await Promise.all([
    getWatchingActivityDays(cookieHeader),
    getWorkActivitySections()
  ]);

  return {
    watchingDays,
    workSections
  };
}
