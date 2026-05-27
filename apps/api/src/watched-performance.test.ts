import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(import.meta.dir, "services/watched.ts"), "utf8");

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

describe("watched API aggregation performance", () => {
  test("all-time rankings use compact Convex aggregates instead of transferring all history", () => {
    const body = getFunctionBody("getMostWatchedAllTime");

    expect(body).toContain("listSyncedMostWatchedAggregates");
    expect(body).not.toContain("listSyncedHistoryEntries");
    expect(body).toContain("limit");
  });

  test("ranged rankings use compact Convex aggregates", () => {
    for (const name of ["getMostWatchedPast30Days", "getMostWatchedForMonth"]) {
      const body = getFunctionBody(name);

      expect(body).toContain("listSyncedMostWatchedAggregates");
      expect(body).not.toContain("listSyncedHistoryEntries");
      expect(body).toContain("limit");
    }
  });
});
