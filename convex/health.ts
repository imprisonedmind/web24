import { v } from "convex/values";

import { mutation, query, type MutationCtx } from "./_generated/server";

const STATE_KEY = "default";
const PRESENTATION_VERSION = "event-category-metrics-v1";

const dailySummaryValidator = v.object({
  date: v.string(),
  steps: v.number(),
  distanceMeters: v.number(),
  activeCaloriesKcal: v.number(),
  totalCaloriesKcal: v.number(),
  exerciseSeconds: v.number(),
  sleepSeconds: v.number(),
  sleepAsleepSeconds: v.optional(v.number()),
  sleepInBedSeconds: v.optional(v.number()),
  exerciseSessions: v.number(),
  sleepSessions: v.number(),
  heartRateMinBpm: v.optional(v.number()),
  heartRateAvgBpm: v.optional(v.number()),
  heartRateMedianBpm: v.optional(v.number()),
  heartRateMaxBpm: v.optional(v.number()),
  heartRateLatestBpm: v.optional(v.number()),
  heartRateLatestAtMs: v.optional(v.number()),
  sources: v.array(v.string()),
  updatedAtMs: v.number(),
});

const activityEventValidator = v.object({
  externalId: v.string(),
  date: v.string(),
  kind: v.union(v.literal("exercise"), v.literal("sleep")),
  title: v.string(),
  activityType: v.optional(v.string()),
  startTime: v.string(),
  endTime: v.string(),
  startTimeMs: v.number(),
  endTimeMs: v.number(),
  durationSeconds: v.number(),
  distanceMeters: v.optional(v.number()),
  steps: v.optional(v.number()),
  caloriesKcal: v.optional(v.number()),
  heartRateMinBpm: v.optional(v.number()),
  heartRateAvgBpm: v.optional(v.number()),
  heartRateMaxBpm: v.optional(v.number()),
  sourcePackageName: v.optional(v.string()),
  metadataId: v.optional(v.string()),
  updatedAtMs: v.number(),
});

const currentStatsValidator = v.object({
  date: v.string(),
  steps: v.optional(v.number()),
  heartRateBpm: v.optional(v.number()),
  heartRateAtMs: v.optional(v.number()),
  sources: v.array(v.string()),
  updatedAtMs: v.number(),
});

const takeoutDailyMetricValidator = v.object({
  date: v.string(),
  steps: v.optional(v.number()),
  distanceMeters: v.optional(v.number()),
  totalCaloriesKcal: v.optional(v.number()),
  heartRateMinBpm: v.optional(v.number()),
  heartRateAvgBpm: v.optional(v.number()),
  heartRateMaxBpm: v.optional(v.number()),
  source: v.string(),
});

const takeoutSleepEventValidator = v.object({
  externalId: v.string(),
  date: v.string(),
  title: v.string(),
  startTime: v.string(),
  endTime: v.string(),
  startTimeMs: v.number(),
  endTimeMs: v.number(),
  durationSeconds: v.number(),
  asleepSeconds: v.optional(v.number()),
  source: v.string(),
});

async function deleteRowsInWindow(
  ctx: MutationCtx,
  windowStartMs: number,
  windowEndMs: number,
  dates: string[],
) {
  const [dailyRows, activityRows] = await Promise.all([
    Promise.all(
      dates.map((date) =>
        ctx.db
          .query("healthDailySummaries")
          .withIndex("by_date", (q: any) => q.eq("date", date))
          .collect(),
      ),
    ).then((rowsByDate) => rowsByDate.flat()),
    ctx.db
      .query("healthActivityEvents")
      .withIndex("by_startTimeMs", (q: any) =>
        q.gte("startTimeMs", windowStartMs).lt("startTimeMs", windowEndMs),
      )
      .collect(),
  ]);

  await Promise.all([
    ...dailyRows.map((row: any) => ctx.db.delete(row._id)),
    ...activityRows.map((row: any) => ctx.db.delete(row._id)),
  ]);
}

function datesFromSummaries(rows: { date: string }[]) {
  return Array.from(new Set(rows.map((row) => row.date)));
}

async function existingSummariesByDate(ctx: MutationCtx, dates: string[]) {
  const rowsByDate = await Promise.all(
    dates.map((date) =>
      ctx.db
        .query("healthDailySummaries")
        .withIndex("by_date", (q: any) => q.eq("date", date))
        .collect(),
    ),
  );

  return new Map(dates.map((date, index) => [date, rowsByDate[index]]));
}

async function deleteRowsForDates(ctx: MutationCtx, dates: string[]) {
  const [dailyRowsByDate, activityRowsByDate] = await Promise.all([
    Promise.all(
      dates.map((date) =>
        ctx.db
          .query("healthDailySummaries")
          .withIndex("by_date", (q: any) => q.eq("date", date))
          .collect(),
      ),
    ),
    Promise.all(
      dates.map((date) =>
        ctx.db
          .query("healthActivityEvents")
          .withIndex("by_date", (q: any) => q.eq("date", date))
          .collect(),
      ),
    ),
  ]);

  await Promise.all([
    ...dailyRowsByDate.flat().map((row: any) => ctx.db.delete(row._id)),
    ...activityRowsByDate.flat().map((row: any) => ctx.db.delete(row._id)),
  ]);
}

function comparableDailySummary(row: any) {
  return JSON.stringify({
    date: row.date,
    steps: row.steps,
    distanceMeters: round(row.distanceMeters),
    activeCaloriesKcal: round(row.activeCaloriesKcal),
    totalCaloriesKcal: round(row.totalCaloriesKcal),
    exerciseSeconds: row.exerciseSeconds,
    sleepSeconds: row.sleepSeconds,
    sleepAsleepSeconds: row.sleepAsleepSeconds ?? null,
    sleepInBedSeconds: row.sleepInBedSeconds ?? null,
    exerciseSessions: row.exerciseSessions,
    sleepSessions: row.sleepSessions,
    heartRateMinBpm: row.heartRateMinBpm ?? null,
    heartRateAvgBpm: round(row.heartRateAvgBpm),
    heartRateMedianBpm: round(row.heartRateMedianBpm),
    heartRateMaxBpm: row.heartRateMaxBpm ?? null,
    heartRateLatestBpm: row.heartRateLatestBpm ?? null,
    heartRateLatestAtMs: row.heartRateLatestAtMs ?? null,
    sources: [...row.sources].sort(),
  });
}

function round(value: number | undefined | null) {
  if (value === undefined || value === null) return null;
  return Math.round(value * 1000) / 1000;
}

function eventCategoryName(event: any) {
  if (event.kind === "sleep") return event.title;
  if (event.title === "Other" || event.activityType === "other") return "Other Exercise";
  return event.title || event.activityType || "Exercise";
}

function buildActivityCategories(events: any[]) {
  const categories = new Map<string, {
    kind: "exercise" | "sleep";
    name: string;
    total: number;
    distanceMeters?: number;
    steps?: number;
    caloriesKcal?: number;
    heartRateAvgBpm?: number;
    heartRateMaxBpm?: number;
    weightedHeartRateTotal?: number;
    heartRateDurationSeconds?: number;
  }>();

  for (const event of events) {
    const name = eventCategoryName(event);
    const key = `${event.kind}:${name}`;
    const existing = categories.get(key);
    if (existing) {
      existing.total += event.durationSeconds;
      existing.distanceMeters = sumOptional(existing.distanceMeters, event.distanceMeters);
      existing.steps = sumOptional(existing.steps, event.steps);
      existing.caloriesKcal = sumOptional(existing.caloriesKcal, event.caloriesKcal);
      existing.heartRateMaxBpm = maxOptional(existing.heartRateMaxBpm, event.heartRateMaxBpm);
      if (event.heartRateAvgBpm !== undefined) {
        existing.weightedHeartRateTotal =
          (existing.weightedHeartRateTotal ?? 0) + event.heartRateAvgBpm * event.durationSeconds;
        existing.heartRateDurationSeconds =
          (existing.heartRateDurationSeconds ?? 0) + event.durationSeconds;
      }
    } else {
      categories.set(key, {
        kind: event.kind,
        name,
        total: event.durationSeconds,
        distanceMeters: event.distanceMeters,
        steps: event.steps,
        caloriesKcal: event.caloriesKcal,
        heartRateMaxBpm: event.heartRateMaxBpm,
        weightedHeartRateTotal:
          event.heartRateAvgBpm !== undefined ? event.heartRateAvgBpm * event.durationSeconds : undefined,
        heartRateDurationSeconds:
          event.heartRateAvgBpm !== undefined ? event.durationSeconds : undefined,
      });
    }
  }

  return Array.from(categories.values())
    .map((category) => {
      const heartRateAvgBpm =
        category.weightedHeartRateTotal !== undefined &&
        category.heartRateDurationSeconds !== undefined &&
        category.heartRateDurationSeconds > 0
          ? category.weightedHeartRateTotal / category.heartRateDurationSeconds
          : undefined;
      const {
        weightedHeartRateTotal: _weightedHeartRateTotal,
        heartRateDurationSeconds: _heartRateDurationSeconds,
        ...publicCategory
      } = category;

      return {
        ...publicCategory,
        distanceMeters: positiveOptional(publicCategory.distanceMeters),
        steps: positiveOptional(publicCategory.steps),
        caloriesKcal: positiveOptional(publicCategory.caloriesKcal),
        heartRateAvgBpm: positiveOptional(heartRateAvgBpm),
        heartRateMaxBpm: positiveOptional(publicCategory.heartRateMaxBpm),
      };
    })
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind.localeCompare(right.kind);
      return right.total - left.total;
    });
}

function sumOptional(left: number | undefined, right: number | undefined) {
  if (left === undefined) return right;
  if (right === undefined) return left;
  return left + right;
}

function maxOptional(left: number | undefined, right: number | undefined) {
  if (left === undefined) return right;
  if (right === undefined) return left;
  return Math.max(left, right);
}

function positiveOptional(value: number | undefined) {
  return value !== undefined && value > 0 ? value : undefined;
}

function positiveNumber(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : undefined;
}

async function deleteRowsPage(
  ctx: MutationCtx,
  tableName: Parameters<typeof ctx.db.query>[0],
  limit: number,
) {
  const rows = await ctx.db.query(tableName).take(limit);
  for (const row of rows) {
    await ctx.db.delete(row._id);
  }

  return rows.length;
}

export const ingestSnapshot = mutation({
  args: {
    syncSource: v.string(),
    writeMode: v.optional(v.union(v.literal("replace_window"), v.literal("upsert_changed"))),
    windowStartMs: v.number(),
    windowEndMs: v.number(),
    dailySummaries: v.array(dailySummaryValidator),
    activityEvents: v.array(activityEventValidator),
  },
  handler: async (ctx, args) => {
    const dates = datesFromSummaries(args.dailySummaries);
    const writeMode = args.writeMode ?? "replace_window";
    let dailySummaries = args.dailySummaries;
    let activityEvents = args.activityEvents;

    if (writeMode === "replace_window") {
      await deleteRowsInWindow(ctx, args.windowStartMs, args.windowEndMs, dates);
    } else {
      const existingByDate = await existingSummariesByDate(ctx, dates);
      const changedDates = args.dailySummaries
        .filter((row) => {
          const existingRows = existingByDate.get(row.date) ?? [];
          return existingRows.length !== 1 ||
            comparableDailySummary(existingRows[0]) !== comparableDailySummary(row);
        })
        .map((row) => row.date);
      const changedDateSet = new Set(changedDates);

      await deleteRowsForDates(ctx, changedDates);
      dailySummaries = args.dailySummaries.filter((row) => changedDateSet.has(row.date));
      activityEvents = args.activityEvents.filter((row) => changedDateSet.has(row.date));
    }

    for (const row of dailySummaries) {
      await ctx.db.insert("healthDailySummaries", row);
    }

    for (const row of activityEvents) {
      const existingEvent = await ctx.db
        .query("healthActivityEvents")
        .withIndex("by_externalId", (q: any) => q.eq("externalId", row.externalId))
        .unique();
      if (existingEvent) continue;
      await ctx.db.insert("healthActivityEvents", row);
    }

    const syncState = {
      key: STATE_KEY,
      syncSource: args.syncSource,
      lastWindowStartMs: args.windowStartMs,
      lastWindowEndMs: args.windowEndMs,
      lastSyncedAtMs: Date.now(),
      dailySummaries: dailySummaries.length,
      activityEvents: activityEvents.length,
    };

    const existingState = await ctx.db
      .query("healthSyncState")
      .withIndex("by_key", (q: any) => q.eq("key", STATE_KEY))
      .unique();

    if (existingState) {
      await ctx.db.patch(existingState._id, syncState);
    } else {
      await ctx.db.insert("healthSyncState", syncState);
    }

    return {
      insertedDailySummaries: dailySummaries.length,
      insertedActivityEvents: activityEvents.length,
      skippedDailySummaries: args.dailySummaries.length - dailySummaries.length,
      skippedActivityEvents: args.activityEvents.length - activityEvents.length,
      writeMode,
      syncedAtMs: syncState.lastSyncedAtMs,
    };
  },
});

export const ingestCurrentStats = mutation({
  args: {
    syncSource: v.string(),
    currentStats: currentStatsValidator,
  },
  handler: async (ctx, args) => {
    const existingState = await ctx.db
      .query("healthSyncState")
      .withIndex("by_key", (q: any) => q.eq("key", STATE_KEY))
      .unique();

    const statePatch = {
      key: STATE_KEY,
      syncSource: args.syncSource,
      currentStats: args.currentStats,
      lastSyncedAtMs: Date.now(),
    };

    if (existingState) {
      await ctx.db.patch(existingState._id, statePatch);
    } else {
      await ctx.db.insert("healthSyncState", {
        ...statePatch,
        lastWindowStartMs: 0,
        lastWindowEndMs: 0,
        dailySummaries: 0,
        activityEvents: 0,
      });
    }

    return {
      syncedAtMs: statePatch.lastSyncedAtMs,
      currentStats: args.currentStats,
    };
  },
});

export const importTakeoutHealthData = mutation({
  args: {
    metrics: v.array(takeoutDailyMetricValidator),
    sleepEvents: v.array(takeoutSleepEventValidator),
  },
  handler: async (ctx, args) => {
    const updatedAtMs = Date.now();
    let metricRowsInserted = 0;
    let metricRowsPatched = 0;
    let metricRowsUnchanged = 0;
    let sleepRowsInserted = 0;
    let sleepDaysSkipped = 0;

    for (const metric of args.metrics) {
      const existingRows = await ctx.db
        .query("healthDailySummaries")
        .withIndex("by_date", (q: any) => q.eq("date", metric.date))
        .collect();
      const existing = existingRows[0];

      if (!existing) {
        await ctx.db.insert("healthDailySummaries", {
          date: metric.date,
          steps: positiveNumber(metric.steps) ?? 0,
          distanceMeters: positiveNumber(metric.distanceMeters) ?? 0,
          activeCaloriesKcal: 0,
          totalCaloriesKcal: positiveNumber(metric.totalCaloriesKcal) ?? 0,
          exerciseSeconds: 0,
          sleepSeconds: 0,
          exerciseSessions: 0,
          sleepSessions: 0,
          heartRateMinBpm: positiveNumber(metric.heartRateMinBpm),
          heartRateAvgBpm: positiveNumber(metric.heartRateAvgBpm),
          heartRateMaxBpm: positiveNumber(metric.heartRateMaxBpm),
          sources: [metric.source],
          updatedAtMs,
        });
        metricRowsInserted += 1;
        continue;
      }

      const patch: Record<string, unknown> = {};
      if (existing.steps <= 0 && positiveNumber(metric.steps) !== undefined) {
        patch.steps = metric.steps;
      }
      if (existing.distanceMeters <= 0 && positiveNumber(metric.distanceMeters) !== undefined) {
        patch.distanceMeters = metric.distanceMeters;
      }
      if (existing.totalCaloriesKcal <= 0 && positiveNumber(metric.totalCaloriesKcal) !== undefined) {
        patch.totalCaloriesKcal = metric.totalCaloriesKcal;
      }
      if (existing.heartRateMinBpm === undefined && positiveNumber(metric.heartRateMinBpm) !== undefined) {
        patch.heartRateMinBpm = metric.heartRateMinBpm;
      }
      if (existing.heartRateAvgBpm === undefined && positiveNumber(metric.heartRateAvgBpm) !== undefined) {
        patch.heartRateAvgBpm = metric.heartRateAvgBpm;
      }
      if (existing.heartRateMaxBpm === undefined && positiveNumber(metric.heartRateMaxBpm) !== undefined) {
        patch.heartRateMaxBpm = metric.heartRateMaxBpm;
      }

      if (Object.keys(patch).length === 0) {
        metricRowsUnchanged += 1;
        continue;
      }

      await ctx.db.patch(existing._id, {
        ...patch,
        sources: Array.from(new Set([...existing.sources, metric.source])).sort(),
        updatedAtMs,
      });
      metricRowsPatched += 1;
    }

    const sleepEventsByDate = new Map<string, typeof args.sleepEvents>();
    for (const event of args.sleepEvents) {
      sleepEventsByDate.set(event.date, [...(sleepEventsByDate.get(event.date) ?? []), event]);
    }

    for (const [date, events] of sleepEventsByDate) {
      const [existingDailyRows, existingSleepEvents] = await Promise.all([
        ctx.db
          .query("healthDailySummaries")
          .withIndex("by_date", (q: any) => q.eq("date", date))
          .collect(),
        ctx.db
          .query("healthActivityEvents")
          .withIndex("by_date", (q: any) => q.eq("date", date))
          .collect(),
      ]);
      const existingDaily = existingDailyRows[0];

      if (
        (existingDaily?.sleepSeconds ?? 0) > 0 ||
        existingSleepEvents.some((event: any) => event.kind === "sleep")
      ) {
        sleepDaysSkipped += 1;
        continue;
      }

      let sleepSeconds = 0;
      let asleepSeconds = 0;
      for (const event of events) {
        const existingEvent = await ctx.db
          .query("healthActivityEvents")
          .withIndex("by_externalId", (q: any) => q.eq("externalId", event.externalId))
          .unique();
        if (existingEvent) continue;

        sleepSeconds += event.durationSeconds;
        asleepSeconds += event.asleepSeconds ?? event.durationSeconds;
        await ctx.db.insert("healthActivityEvents", {
          externalId: event.externalId,
          date: event.date,
          kind: "sleep",
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          startTimeMs: event.startTimeMs,
          endTimeMs: event.endTimeMs,
          durationSeconds: event.durationSeconds,
          sourcePackageName: event.source,
          metadataId: event.externalId,
          updatedAtMs,
        });
        sleepRowsInserted += 1;
      }

      if (sleepSeconds <= 0) continue;

      if (existingDaily) {
        await ctx.db.patch(existingDaily._id, {
          sleepSeconds,
          sleepAsleepSeconds: asleepSeconds,
          sleepInBedSeconds: sleepSeconds,
          sleepSessions: events.length,
          sources: Array.from(new Set([...existingDaily.sources, "google-fit-takeout"])).sort(),
          updatedAtMs,
        });
      } else {
        await ctx.db.insert("healthDailySummaries", {
          date,
          steps: 0,
          distanceMeters: 0,
          activeCaloriesKcal: 0,
          totalCaloriesKcal: 0,
          exerciseSeconds: 0,
          sleepSeconds,
          sleepAsleepSeconds: asleepSeconds,
          sleepInBedSeconds: sleepSeconds,
          exerciseSessions: 0,
          sleepSessions: events.length,
          sources: ["google-fit-takeout"],
          updatedAtMs,
        });
      }
    }

    const existingState = await ctx.db
      .query("healthSyncState")
      .withIndex("by_key", (q: any) => q.eq("key", STATE_KEY))
      .unique();

    if (existingState) {
      await ctx.db.patch(existingState._id, { lastSyncedAtMs: updatedAtMs });
    }

    return {
      metricRowsInserted,
      metricRowsPatched,
      metricRowsUnchanged,
      sleepRowsInserted,
      sleepDaysSkipped,
      processedMetricRows: args.metrics.length,
      processedSleepEvents: args.sleepEvents.length,
      syncedAtMs: updatedAtMs,
    };
  },
});

export const clearHealthData = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 500, 750);
    const dailySummaries = await deleteRowsPage(ctx, "healthDailySummaries", limit);
    const activityEvents = await deleteRowsPage(ctx, "healthActivityEvents", limit);
    const syncState = await deleteRowsPage(ctx, "healthSyncState", limit);

    return {
      dailySummaries,
      activityEvents,
      syncState,
      hasMore:
        dailySummaries === limit ||
        activityEvents === limit ||
        syncState === limit,
    };
  },
});

export const getCurrentStats = query({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db
      .query("healthSyncState")
      .withIndex("by_key", (q: any) => q.eq("key", STATE_KEY))
      .unique();

    return state?.currentStats ?? null;
  },
});

export const listDailyActivity = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [rows, events] = await Promise.all([
      ctx.db.query("healthDailySummaries").withIndex("by_date").collect(),
      ctx.db.query("healthActivityEvents").withIndex("by_date").collect(),
    ]);
    const eventsByDate = new Map<string, any[]>();

    for (const event of events) {
      if (args.startDate && event.date < args.startDate) continue;
      if (args.endDate && event.date > args.endDate) continue;
      eventsByDate.set(event.date, [...(eventsByDate.get(event.date) ?? []), event]);
    }

    return rows
      .filter((row) => {
        if (args.startDate && row.date < args.startDate) return false;
        if (args.endDate && row.date > args.endDate) return false;
        return true;
      })
      .sort((left, right) => left.date.localeCompare(right.date))
      .map(({ _id: _rowId, _creationTime: _rowCreationTime, ...row }) => ({
        ...row,
        totalSeconds: row.exerciseSeconds + row.sleepSeconds,
        activityCategories: buildActivityCategories(eventsByDate.get(row.date) ?? []),
      }));
  },
});

export const getSyncVersion = query({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db
      .query("healthSyncState")
      .withIndex("by_key", (q: any) => q.eq("key", STATE_KEY))
      .unique();

    if (!state) return "empty";
    return `${PRESENTATION_VERSION}:${state.lastSyncedAtMs}:${state.dailySummaries}:${state.activityEvents}`;
  },
});
