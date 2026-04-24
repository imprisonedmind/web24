import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";

const DEFAULT_TAKEOUT_PATH = path.join(
  process.env.HOME ?? "",
  "Downloads",
  "Takeout",
  "Fit",
);
const DEFAULT_CONVEX_URL = "https://diligent-axolotl-318.eu-west-1.convex.cloud";
const TAKEOUT_SOURCE = "google-fit-takeout";
const BATCH_SIZE = 80;
const LOCAL_TIME_ZONE = "Africa/Johannesburg";

type TakeoutMetric = {
  date: string;
  steps?: number;
  distanceMeters?: number;
  totalCaloriesKcal?: number;
  heartRateMinBpm?: number;
  heartRateAvgBpm?: number;
  heartRateMaxBpm?: number;
  source: string;
};

type TakeoutSleepEvent = {
  externalId: string;
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  startTimeMs: number;
  endTimeMs: number;
  durationSeconds: number;
  asleepSeconds?: number;
  source: string;
};

type TakeoutExerciseEvent = {
  externalId: string;
  date: string;
  title: string;
  activityType: string;
  startTime: string;
  endTime: string;
  startTimeMs: number;
  endTimeMs: number;
  durationSeconds: number;
  steps?: number;
  distanceMeters?: number;
  caloriesKcal?: number;
  heartRateMinBpm?: number;
  heartRateAvgBpm?: number;
  heartRateMaxBpm?: number;
  source: string;
};

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function positive(value: number) {
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0]?.split(",") ?? [];
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function localDate(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LOCAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

async function readDailyMetrics(takeoutPath: string) {
  const dir = path.join(takeoutPath, "Daily activity metrics");
  const files = (await readdir(dir)).filter((file) => /^\d{4}-\d{2}-\d{2}\.csv$/.test(file));
  const metrics: TakeoutMetric[] = [];

  for (const file of files) {
    const date = file.replace(".csv", "");
    const rows = parseCsv(await readFile(path.join(dir, file), "utf8"));
    let steps = 0;
    let distanceMeters = 0;
    let totalCaloriesKcal = 0;
    let heartRateAverageTotal = 0;
    let heartRateAverageCount = 0;
    let heartRateMinBpm: number | undefined;
    let heartRateMaxBpm: number | undefined;

    for (const row of rows) {
      steps += parseNumber(row["Step count"]) ?? 0;
      distanceMeters += parseNumber(row["Distance (m)"]) ?? 0;
      totalCaloriesKcal += parseNumber(row["Calories (kcal)"]) ?? 0;

      const averageHeartRate = parseNumber(row["Average heart rate (bpm)"]);
      if (averageHeartRate !== undefined) {
        heartRateAverageTotal += averageHeartRate;
        heartRateAverageCount += 1;
      }

      const minHeartRate = parseNumber(row["Min heart rate (bpm)"]);
      if (minHeartRate !== undefined) {
        heartRateMinBpm =
          heartRateMinBpm === undefined ? minHeartRate : Math.min(heartRateMinBpm, minHeartRate);
      }

      const maxHeartRate = parseNumber(row["Max heart rate (bpm)"]);
      if (maxHeartRate !== undefined) {
        heartRateMaxBpm =
          heartRateMaxBpm === undefined ? maxHeartRate : Math.max(heartRateMaxBpm, maxHeartRate);
      }
    }

    metrics.push({
      date,
      steps: positive(Math.round(steps)),
      distanceMeters: positive(distanceMeters),
      totalCaloriesKcal: positive(totalCaloriesKcal),
      heartRateMinBpm: positive(heartRateMinBpm ?? 0),
      heartRateAvgBpm: positive(
        heartRateAverageCount > 0 ? heartRateAverageTotal / heartRateAverageCount : 0,
      ),
      heartRateMaxBpm: positive(heartRateMaxBpm ?? 0),
      source: TAKEOUT_SOURCE,
    });
  }

  return metrics.sort((left, right) => left.date.localeCompare(right.date));
}

function durationSeconds(startTime: string, endTime: string) {
  return Math.max(0, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000));
}

async function readSleepEvents(takeoutPath: string) {
  const dir = path.join(takeoutPath, "All Sessions");
  const files = (await readdir(dir)).filter((file) => file.endsWith("_SLEEP.json"));
  const events: TakeoutSleepEvent[] = [];

  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(dir, file), "utf8")) as {
      startTime: string;
      endTime: string;
      duration?: string;
      segment?: { fitnessActivity: string; startTime: string; endTime: string }[];
    };
    const startTimeMs = new Date(raw.startTime).getTime();
    const endTimeMs = new Date(raw.endTime).getTime();
    const duration = durationSeconds(raw.startTime, raw.endTime);
    if (!Number.isFinite(startTimeMs) || !Number.isFinite(endTimeMs) || duration <= 0) continue;

    const asleepSeconds = (raw.segment ?? [])
      .filter((segment) => segment.fitnessActivity !== "sleep.awake")
      .reduce((total, segment) => total + durationSeconds(segment.startTime, segment.endTime), 0);

    events.push({
      externalId: `google-fit-takeout:sleep:${startTimeMs}:${endTimeMs}`,
      date: localDate(raw.endTime),
      title: duration < 3 * 60 * 60 ? "Nap" : "Sleep",
      startTime: raw.startTime,
      endTime: raw.endTime,
      startTimeMs,
      endTimeMs,
      durationSeconds: duration,
      asleepSeconds: positive(asleepSeconds),
      source: TAKEOUT_SOURCE,
    });
  }

  return events.sort((left, right) => left.startTimeMs - right.startTimeMs);
}

async function readExerciseSessions(takeoutPath: string) {
  const dir = path.join(takeoutPath, "All Sessions");
  const files = (await readdir(dir)).filter(
    (file) => file.endsWith(".json") && !file.endsWith("_SLEEP.json")
  );
  const events: TakeoutExerciseEvent[] = [];

  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(dir, file), "utf8")) as {
      fitnessActivity: string;
      startTime: string;
      endTime: string;
      duration?: string;
      aggregate?: { metricName: string; intValue?: number; floatValue?: number }[];
    };

    if (!raw.fitnessActivity || raw.fitnessActivity.startsWith("sleep")) {
      continue;
    }

    const startTimeMs = new Date(raw.startTime).getTime();
    const endTimeMs = new Date(raw.endTime).getTime();
    const duration = durationSeconds(raw.startTime, raw.endTime);
    if (!Number.isFinite(startTimeMs) || !Number.isFinite(endTimeMs) || duration <= 0) continue;

    // Parse aggregate metrics
    let steps: number | undefined;
    let distanceMeters: number | undefined;
    let caloriesKcal: number | undefined;

    for (const agg of raw.aggregate ?? []) {
      switch (agg.metricName) {
        case "com.google.step_count.delta":
          steps = agg.intValue ?? agg.floatValue;
          break;
        case "com.google.distance.delta":
          distanceMeters = agg.intValue ?? agg.floatValue;
          break;
        case "com.google.calories.expended":
          caloriesKcal = agg.floatValue ?? agg.intValue;
          break;
      }
    }

    // Format title from activity type
    const activityType = raw.fitnessActivity ?? "unknown";
    const title = activityType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    events.push({
      externalId: `google-fit-takeout:exercise:${startTimeMs}:${endTimeMs}`,
      date: localDate(raw.startTime),
      title,
      activityType,
      startTime: raw.startTime,
      endTime: raw.endTime,
      startTimeMs,
      endTimeMs,
      durationSeconds: duration,
      steps: positive(steps),
      distanceMeters: positive(distanceMeters),
      caloriesKcal: positive(caloriesKcal),
      source: TAKEOUT_SOURCE,
    });
  }

  return events.sort((left, right) => left.startTimeMs - right.startTimeMs);
}

function monthSummary(metrics: TakeoutMetric[], sleepEvents: TakeoutSleepEvent[], exerciseEvents: TakeoutExerciseEvent[]) {
  const byMonth = new Map<string, {
    month: string;
    metricDays: number;
    stepDays: number;
    totalSteps: number;
    sleepEvents: number;
    exerciseEvents: number;
    exerciseEventDays: Set<string>;
  }>();

  for (const metric of metrics) {
    const month = metric.date.slice(0, 7);
    const entry = byMonth.get(month) ?? {
      month,
      metricDays: 0,
      stepDays: 0,
      totalSteps: 0,
      sleepEvents: 0,
      exerciseEvents: 0,
      exerciseEventDays: new Set(),
    };
    entry.metricDays += 1;
    if ((metric.steps ?? 0) > 0) entry.stepDays += 1;
    entry.totalSteps += metric.steps ?? 0;
    byMonth.set(month, entry);
  }

  for (const event of sleepEvents) {
    const month = event.date.slice(0, 7);
    const entry = byMonth.get(month) ?? {
      month,
      metricDays: 0,
      stepDays: 0,
      totalSteps: 0,
      sleepEvents: 0,
      exerciseEvents: 0,
      exerciseEventDays: new Set(),
    };
    entry.sleepEvents += 1;
    byMonth.set(month, entry);
  }

  for (const event of exerciseEvents) {
    const month = event.date.slice(0, 7);
    const entry = byMonth.get(month) ?? {
      month,
      metricDays: 0,
      stepDays: 0,
      totalSteps: 0,
      sleepEvents: 0,
      exerciseEvents: 0,
      exerciseEventDays: new Set(),
    };
    entry.exerciseEvents += 1;
    entry.exerciseEventDays.add(event.date);
    byMonth.set(month, entry);
  }

  return Array.from(byMonth.values())
    .map((entry) => ({
      ...entry,
      exerciseEventDays: entry.exerciseEventDays.size,
    }))
    .sort((left, right) => left.month.localeCompare(right.month));
}

async function main() {
  const takeoutPath = argValue("--takeout") ?? DEFAULT_TAKEOUT_PATH;
  const convexUrl = argValue("--convex-url") ?? process.env.CONVEX_URL ?? DEFAULT_CONVEX_URL;
  const dryRun = process.argv.includes("--dry-run");
  const metrics = await readDailyMetrics(takeoutPath);
  const sleepEvents = await readSleepEvents(takeoutPath);
  const exerciseEvents = await readExerciseSessions(takeoutPath);

  console.table(monthSummary(metrics, sleepEvents, exerciseEvents));
  console.log(`Parsed ${metrics.length} daily metric files, ${sleepEvents.length} sleep sessions, and ${exerciseEvents.length} exercise sessions.`);

  if (dryRun) {
    console.log("Dry run only; no Convex writes performed.");
    return;
  }

  const convex = new ConvexHttpClient(convexUrl);
  let totals = {
    metricRowsInserted: 0,
    metricRowsPatched: 0,
    metricRowsUnchanged: 0,
    sleepRowsInserted: 0,
    sleepDaysSkipped: 0,
    exerciseRowsInserted: 0,
    exerciseRowsSkipped: 0,
    processedMetricRows: 0,
    processedSleepEvents: 0,
    processedExerciseEvents: 0,
  };

  const maxLength = Math.max(metrics.length, sleepEvents.length, exerciseEvents.length);
  for (let index = 0; index < maxLength; index += BATCH_SIZE) {
    const result = await convex.mutation(api.health.importTakeoutHealthData, {
      metrics: metrics.slice(index, index + BATCH_SIZE),
      sleepEvents: sleepEvents.slice(index, index + BATCH_SIZE),
      exerciseEvents: exerciseEvents.slice(index, index + BATCH_SIZE),
    });

    totals = {
      metricRowsInserted: totals.metricRowsInserted + result.metricRowsInserted,
      metricRowsPatched: totals.metricRowsPatched + result.metricRowsPatched,
      metricRowsUnchanged: totals.metricRowsUnchanged + result.metricRowsUnchanged,
      sleepRowsInserted: totals.sleepRowsInserted + result.sleepRowsInserted,
      sleepDaysSkipped: totals.sleepDaysSkipped + result.sleepDaysSkipped,
      exerciseRowsInserted: totals.exerciseRowsInserted + result.exerciseRowsInserted,
      exerciseRowsSkipped: totals.exerciseRowsSkipped + result.exerciseRowsSkipped,
      processedMetricRows: totals.processedMetricRows + result.processedMetricRows,
      processedSleepEvents: totals.processedSleepEvents + result.processedSleepEvents,
      processedExerciseEvents: totals.processedExerciseEvents + result.processedExerciseEvents,
    };
  }

  console.log("Import complete.");
  console.table([totals]);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
