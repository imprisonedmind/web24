import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listDailyActivity, listHistoryEntries, listMostWatchedAggregates, upsertHistoryBatch } from "./trakt";

const source = readFileSync(join(import.meta.dir, "trakt.ts"), "utf8");

type HistoryEntry = {
  historyId: string;
  watchedAt: string;
  watchedAtMs: number;
  entryType: "movie" | "show" | "episode";
  title: string;
  subtitle?: string;
  posterUrl: string;
  href: string;
  showTitle?: string;
  episodeTitle?: string;
  season?: number;
  episode?: number;
  runtimeMinutes: number;
  aggregateKey: string;
  aggregateType: "movie" | "show";
  aggregateTitle: string;
  aggregateHref: string;
  aggregatePosterUrl: string;
  aggregateRuntimeMinutes: number;
};

type StoredHistoryEntry = HistoryEntry & {
  _id: string;
  _creationTime: number;
};

type QueryStats = {
  historyCollects: Array<{
    indexName: string | null;
    rows: number;
  }>;
  historyTakes: Array<{
    indexName: string | null;
    rows: number;
  }>;
  dailyActivityCollects: Array<{
    indexName: string | null;
    rows: number;
  }>;
  watchAggregateTakes: Array<{
    indexName: string | null;
    rows: number;
  }>;
};

function getFunctionBody(name: string) {
  const declaration = `function ${name}`;
  const start = source.indexOf(declaration);
  expect(start).toBeGreaterThanOrEqual(0);

  const bodyStart = source.indexOf("{", start);
  expect(bodyStart).toBeGreaterThanOrEqual(0);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(bodyStart + 1, index);
  }

  throw new Error(`Could not find end of ${name}`);
}

function getExportedHandlerBody(name: string) {
  const declaration = `export const ${name}`;
  const start = source.indexOf(declaration);
  expect(start).toBeGreaterThanOrEqual(0);

  const handlerStart = source.indexOf("handler:", start);
  expect(handlerStart).toBeGreaterThanOrEqual(0);

  const bodyStart = source.indexOf("{", handlerStart);
  expect(bodyStart).toBeGreaterThanOrEqual(0);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(bodyStart + 1, index);
  }

  throw new Error(`Could not find handler end of ${name}`);
}

function historyEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  const watchedAtMs = overrides.watchedAtMs ?? Date.parse("2026-05-27T10:00:00.000Z");

  return {
    historyId: overrides.historyId ?? `history-${watchedAtMs}`,
    watchedAt: overrides.watchedAt ?? new Date(watchedAtMs).toISOString(),
    watchedAtMs,
    entryType: overrides.entryType ?? "movie",
    title: overrides.title ?? "Test Movie",
    subtitle: overrides.subtitle,
    posterUrl: overrides.posterUrl ?? "/poster.jpg",
    href: overrides.href ?? "https://trakt.tv/movies/test-movie",
    showTitle: overrides.showTitle,
    episodeTitle: overrides.episodeTitle,
    season: overrides.season,
    episode: overrides.episode,
    runtimeMinutes: overrides.runtimeMinutes ?? 90,
    aggregateKey: overrides.aggregateKey ?? "movie:test",
    aggregateType: overrides.aggregateType ?? "movie",
    aggregateTitle: overrides.aggregateTitle ?? "Test Movie",
    aggregateHref: overrides.aggregateHref ?? "https://trakt.tv/movies/test-movie",
    aggregatePosterUrl: overrides.aggregatePosterUrl ?? "/poster.jpg",
    aggregateRuntimeMinutes: overrides.aggregateRuntimeMinutes ?? 90,
  };
}

function storedHistoryEntry(index: number, overrides: Partial<HistoryEntry> = {}): StoredHistoryEntry {
  return {
    _id: `history-doc-${index}`,
    _creationTime: index,
    ...historyEntry({
      historyId: `existing-history-${index}`,
      watchedAtMs: Date.parse("2025-01-01T10:00:00.000Z") + index * 24 * 60 * 60 * 1000,
      aggregateKey: `movie:existing-${index}`,
      href: `https://trakt.tv/movies/existing-${index}`,
      title: `Existing ${index}`,
      aggregateTitle: `Existing ${index}`,
      ...overrides,
    }),
  };
}

function dailyActivityRow(index: number) {
  const date = new Date(Date.parse("2025-01-01T00:00:00.000Z") + index * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    _id: `daily-activity-${index}`,
    _creationTime: index,
    date,
    totalSeconds: 3_600,
    movieSeconds: 3_600,
    episodeSeconds: 0,
    updatedAtMs: Date.parse(`${date}T12:00:00.000Z`),
  };
}

function watchAggregateRow(index: number, overrides: Record<string, unknown> = {}) {
  return {
    _id: `watch-aggregate-${index}`,
    _creationTime: index,
    aggregateKey: `movie:${index}`,
    aggregateType: "movie",
    aggregateTitle: `Movie ${index}`,
    aggregateHref: `https://trakt.tv/movies/movie-${index}`,
    aggregatePosterUrl: "/poster.jpg",
    minutes: 1_000 - index,
    plays: 10,
    updatedAtMs: Date.parse("2026-05-27T12:00:00.000Z"),
    ...overrides,
  };
}

function createMockCtx(historyRows: StoredHistoryEntry[], dailyActivityRows: any[] = [], watchAggregateRows: any[] = []) {
  const stats: QueryStats = {
    historyCollects: [],
    historyTakes: [],
    dailyActivityCollects: [],
    watchAggregateTakes: [],
  };
  const tables: Record<string, any[]> = {
    traktHistoryEntries: [...historyRows],
    traktDailyActivity: [...dailyActivityRows],
    traktWatchAggregates: [...watchAggregateRows],
  };
  let nextId = 10_000;

  function rowsFor(table: string) {
    tables[table] ??= [];
    return tables[table];
  }

  function query(table: string) {
    let indexName: string | null = null;
    const predicates: Array<(row: any) => boolean> = [];
    let orderDirection: "asc" | "desc" = "asc";

    const builder = {
      withIndex(nextIndexName: string, rangeBuilder?: (q: any) => any) {
        indexName = nextIndexName;
        const range = {
          eq(field: string, value: unknown) {
            predicates.push((row) => row[field] === value);
            return range;
          },
          gte(field: string, value: number | string) {
            predicates.push((row) => row[field] >= value);
            return range;
          },
          lte(field: string, value: number | string) {
            predicates.push((row) => row[field] <= value);
            return range;
          },
          lt(field: string, value: number | string) {
            predicates.push((row) => row[field] < value);
            return range;
          },
        };
        rangeBuilder?.(range);
        return builder;
      },
      order(direction: "asc" | "desc") {
        orderDirection = direction;
        return builder;
      },
      async collect() {
        const results = applyQuery();
        if (table === "traktHistoryEntries") {
          stats.historyCollects.push({ indexName, rows: results.length });
        }
        if (table === "traktDailyActivity") {
          stats.dailyActivityCollects.push({ indexName, rows: results.length });
        }
        return results;
      },
      async take(limit: number) {
        const results = applyQuery().slice(0, limit);
        if (table === "traktHistoryEntries") {
          stats.historyTakes.push({ indexName, rows: results.length });
        }
        if (table === "traktWatchAggregates") {
          stats.watchAggregateTakes.push({ indexName, rows: results.length });
        }
        return results;
      },
      async unique() {
        return applyQuery()[0] ?? null;
      },
    };

    function applyQuery() {
      const results = rowsFor(table).filter((row) => predicates.every((predicate) => predicate(row)));
      if (table === "traktHistoryEntries") {
        results.sort((left, right) =>
          orderDirection === "desc"
            ? right.watchedAtMs - left.watchedAtMs
            : left.watchedAtMs - right.watchedAtMs,
        );
      }
      if (table === "traktDailyActivity") {
        results.sort((left, right) =>
          orderDirection === "desc" ? right.date.localeCompare(left.date) : left.date.localeCompare(right.date),
        );
      }
      if (table === "traktWatchAggregates") {
        results.sort((left, right) =>
          orderDirection === "desc" ? right.minutes - left.minutes : left.minutes - right.minutes,
        );
      }
      return results;
    }

    return builder;
  }

  return {
    stats,
    tables,
    ctx: {
      db: {
        query,
        async insert(table: string, value: Record<string, unknown>) {
          const row = {
            _id: `${table}-${nextId}`,
            _creationTime: nextId,
            ...value,
          };
          nextId += 1;
          rowsFor(table).push(row);
          return row._id;
        },
        async patch(id: string, value: Record<string, unknown>) {
          for (const rows of Object.values(tables)) {
            const row = rows.find((candidate) => candidate._id === id);
            if (row) Object.assign(row, value);
          }
        },
        async delete(id: string) {
          for (const [table, rows] of Object.entries(tables)) {
            tables[table] = rows.filter((row) => row._id !== id);
          }
        },
      },
    },
  };
}

describe("Trakt history query performance", () => {
  test("upsert duplicate detection uses the watched-at index instead of full history scans", () => {
    const body = getFunctionBody("upsertHistoryEntries");

    expect(body).not.toContain('query("traktHistoryEntries").collect()');
    expect(body).toContain('withIndex("by_historyId"');
    expect(body).toContain('withIndex("by_watchedAtMs"');
    expect(body).toContain('gte("watchedAtMs", startMs)');
    expect(body).toContain('lt("watchedAtMs", endMs)');
  });

  test("history listing pushes range, order, and limit into the indexed query", () => {
    const body = getExportedHandlerBody("listHistoryEntries");

    expect(body).not.toContain(".filter(");
    expect(body).not.toContain(".sort(");
    expect(body).toContain('withIndex("by_watchedAtMs"');
    expect(body).toContain('gte("watchedAtMs", args.startMs)');
    expect(body).toContain('lt("watchedAtMs", args.endMs)');
    expect(body).toContain(".order(order)");
    expect(body).toContain(".take(args.limit)");
  });

  test("daily activity listing pushes date range into the indexed query", () => {
    const body = getExportedHandlerBody("listDailyActivity");

    expect(body).not.toContain(".filter(");
    expect(body).not.toContain(".sort(");
    expect(body).toContain('withIndex("by_date"');
    expect(body).toContain('gte("date", args.startDate)');
    expect(body).toContain('lte("date", args.endDate)');
  });

  test("most watched aggregate query returns top items from Convex", () => {
    const body = getExportedHandlerBody("listMostWatchedAggregates");

    expect(body).toContain('query("traktWatchAggregates")');
    expect(body).toContain('withIndex("by_minutes")');
    expect(body).toContain(".take(args.limit ?? 12)");
    expect(body).toContain('withIndex("by_watchedAtMs"');
    expect(body).toContain('gte("watchedAtMs", args.startMs)');
    expect(body).toContain('lt("watchedAtMs", args.endMs)');
    expect(body).toContain(".slice(0, args.limit ?? 12)");
  });

  test("recent sync upsert reads only the relevant history day for dedupe", async () => {
    const unrelatedRows = Array.from({ length: 5_000 }, (_, index) =>
      storedHistoryEntry(index, {
        watchedAtMs: Date.parse("2024-01-01T10:00:00.000Z") + index * 60 * 60 * 1000,
      }),
    );
    const duplicate = storedHistoryEntry(6_000, {
      historyId: "old-history-id",
      watchedAtMs: Date.parse("2026-05-27T09:00:00.000Z"),
      aggregateKey: "movie:test",
      href: "https://trakt.tv/movies/test-movie",
      title: "Test Movie",
      aggregateTitle: "Test Movie",
    });
    const { ctx, stats, tables } = createMockCtx([...unrelatedRows, duplicate]);

    const result = await (upsertHistoryBatch as any)._handler(ctx, {
      entries: [
        historyEntry({
          historyId: "new-history-id",
          watchedAtMs: Date.parse("2026-05-27T10:00:00.000Z"),
        }),
      ],
    });

    expect(result).toEqual({ inserted: 1, updated: 0, skipped: 0, deduped: 1 });
    expect(tables.traktHistoryEntries).toHaveLength(5_001);
    expect(stats.historyCollects).toEqual([
      { indexName: "by_historyId", rows: 0 },
      { indexName: "by_watchedAtMs", rows: 1 },
    ]);
  });

  test("history listing returns a limited indexed range without collecting the table", async () => {
    const rows = Array.from({ length: 5_000 }, (_, index) => storedHistoryEntry(index));
    const startMs = Date.parse("2025-03-01T00:00:00.000Z");
    const endMs = Date.parse("2025-04-01T00:00:00.000Z");
    const { ctx, stats } = createMockCtx(rows);

    const results = await (listHistoryEntries as any)._handler(ctx, {
      startMs,
      endMs,
      limit: 5,
      order: "desc",
    });

    expect(results).toHaveLength(5);
    expect(results.every((entry: HistoryEntry) => entry.watchedAtMs >= startMs && entry.watchedAtMs < endMs)).toBe(true);
    expect(results.map((entry: HistoryEntry) => entry.watchedAtMs)).toEqual(
      [...results].map((entry: HistoryEntry) => entry.watchedAtMs).sort((left, right) => right - left),
    );
    expect(stats.historyCollects).toEqual([]);
    expect(stats.historyTakes).toEqual([{ indexName: "by_watchedAtMs", rows: 5 }]);
  });

  test("daily activity listing reads only the requested indexed date range", async () => {
    const rows = Array.from({ length: 500 }, (_, index) => dailyActivityRow(index));
    const { ctx, stats } = createMockCtx([], rows);

    const results = await (listDailyActivity as any)._handler(ctx, {
      startDate: "2025-03-01",
      endDate: "2025-03-31",
    });

    expect(results).toHaveLength(31);
    expect(results[0]).not.toHaveProperty("_id");
    expect(results.every((row: { date: string }) => row.date >= "2025-03-01" && row.date <= "2025-03-31")).toBe(true);
    expect(stats.dailyActivityCollects).toEqual([{ indexName: "by_date", rows: 31 }]);
  });

  test("most watched aggregate query returns a small ranked payload", async () => {
    const rows = Array.from({ length: 5_000 }, (_, index) =>
      watchAggregateRow(index, {
        minutes: 5_000 - index,
      }),
    );
    const { ctx, stats } = createMockCtx([], [], rows);

    const results = await (listMostWatchedAggregates as any)._handler(ctx, {
      limit: 5,
    });

    expect(results).toHaveLength(5);
    expect(results.map((item: { minutes: number }) => item.minutes)).toEqual(
      [...results].map((item: { minutes: number }) => item.minutes).sort((left, right) => right - left),
    );
    expect(results.every((item: { plays: number }) => item.plays === 10)).toBe(true);
    expect(stats.historyCollects).toEqual([]);
    expect(stats.watchAggregateTakes).toEqual([{ indexName: "by_minutes", rows: 5 }]);
  });
});
