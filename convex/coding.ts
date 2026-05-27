import { v } from "convex/values";

import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

const WAKATIME_SHARE_URL =
  "__REMOVED_WAKATIME_SHARE_URL__";

const codingCategoryValidator = v.object({
  name: v.string(),
  total: v.number(),
});

const codingDayValidator = v.object({
  date: v.string(),
  total: v.number(),
  categories: v.array(codingCategoryValidator),
});

type CodingDay = {
  date: string;
  total: number;
  categories: {
    name: string;
    total: number;
  }[];
};

function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase() === "ai coding" ? "Coding" : name;
}

function normalizeWakaDay(day: CodingDay): CodingDay {
  const categoryTotals = new Map<string, number>();

  for (const category of day.categories ?? []) {
    const name = normalizeCategoryName(category.name);
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + category.total);
  }

  return {
    date: day.date,
    total: day.total,
    categories: Array.from(categoryTotals, ([name, total]) => ({ name, total })),
  };
}

export const listDailyActivity = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("codingDailyActivity")
      .withIndex("by_date", (q: any) => {
        let range = q;
        if (args.startDate) {
          range = range.gte("date", args.startDate);
        }
        if (args.endDate) {
          range = range.lte("date", args.endDate);
        }
        return range;
      })
      .collect();

    return rows.map(({ _id: _rowId, _creationTime: _rowCreationTime, ...row }) => row);
  },
});

export const syncWakaTime = action({
  args: {},
  handler: async (ctx) => {
    const response = await fetch(WAKATIME_SHARE_URL, {
      headers: {
        dataType: "jsonp",
      },
    });

    if (!response.ok) {
      throw new Error(`WakaTime request failed (${response.status})`);
    }

    const payload = (await response.json()) as { days?: CodingDay[] } | null;
    const todayIso = new Date().toISOString().slice(0, 10);
    const rows = Array.isArray(payload?.days)
      ? payload.days
          .filter((day) => day?.date && day.date <= todayIso)
          .map(normalizeWakaDay)
      : [];

    await ctx.runMutation(internal.coding.replaceDailyActivityInternal, { rows });

    return {
      days: rows.length,
    };
  },
});

export const replaceDailyActivityInternal = internalMutation({
  args: {
    rows: v.array(codingDayValidator),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("codingDailyActivity").collect();
    await Promise.all(existing.map((row) => ctx.db.delete(row._id)));

    const updatedAtMs = Date.now();
    for (const row of args.rows) {
      await ctx.db.insert("codingDailyActivity", {
        ...row,
        updatedAtMs,
      });
    }

    return {
      replaced: args.rows.length,
    };
  },
});
