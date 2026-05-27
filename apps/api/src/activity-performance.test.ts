import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(import.meta.dir, "services/activity.ts"), "utf8");

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

describe("activity API performance", () => {
  test("home activity does not block indefinitely on WakaTime", () => {
    const body = getFunctionBody("getHomeActivityDays");

    expect(source).toContain("HOME_CODING_ACTIVITY_WAIT_MS");
    expect(source).toContain("withFallbackTimeout");
    expect(body).toContain("withFallbackTimeout(getCodingActivityDays()");
  });
});
