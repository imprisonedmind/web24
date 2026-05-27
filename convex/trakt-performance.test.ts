import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(import.meta.dir, "trakt.ts"), "utf8");

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
});
