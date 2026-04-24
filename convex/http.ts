import { httpRouter } from "convex/server";

import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

type HealthUploadPayload = {
  syncSource: string;
  writeMode?: "replace_window" | "upsert_changed";
  windowStartMs: number;
  windowEndMs: number;
  dailySummaries: {
    date: string;
    steps: number;
    distanceMeters: number;
    activeCaloriesKcal: number;
    totalCaloriesKcal: number;
    exerciseSeconds: number;
    sleepSeconds: number;
    sleepAsleepSeconds?: number;
    sleepInBedSeconds?: number;
    exerciseSessions: number;
    sleepSessions: number;
    heartRateMinBpm?: number;
    heartRateAvgBpm?: number;
    heartRateMedianBpm?: number;
    heartRateMaxBpm?: number;
    heartRateLatestBpm?: number;
    heartRateLatestAtMs?: number;
    sources: string[];
    updatedAtMs: number;
  }[];
  activityEvents: {
    externalId: string;
    date: string;
    kind: "exercise" | "sleep";
    title: string;
    activityType?: string;
    startTime: string;
    endTime: string;
    startTimeMs: number;
    endTimeMs: number;
    durationSeconds: number;
    distanceMeters?: number;
    steps?: number;
    caloriesKcal?: number;
    heartRateMinBpm?: number;
    heartRateAvgBpm?: number;
    heartRateMaxBpm?: number;
    sourcePackageName?: string;
    metadataId?: string;
    updatedAtMs: number;
  }[];
};

type HealthCurrentStatsPayload = {
  syncSource: string;
  currentStats: {
    date: string;
    steps?: number;
    heartRateBpm?: number;
    heartRateAtMs?: number;
    sources: string[];
    updatedAtMs: number;
  };
};

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function missingSecret() {
  return new Response(
    JSON.stringify({ error: "Missing HEALTH_SYNC_SHARED_SECRET in Convex environment" }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

function validateSecret(request: Request) {
  const expectedSecret = process.env.HEALTH_SYNC_SHARED_SECRET;

  if (!expectedSecret) return false;

  const authorization = request.headers.get("authorization");
  const providedSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  return providedSecret === expectedSecret;
}

http.route({
  path: "/health-sync/upload",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.HEALTH_SYNC_SHARED_SECRET;

    if (!expectedSecret) {
      return missingSecret();
    }

    if (!validateSecret(request)) {
      return unauthorized();
    }

    const payload = (await request.json()) as HealthUploadPayload;
    const result = await ctx.runMutation(api.health.ingestSnapshot, payload);

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/health-sync/current",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!process.env.HEALTH_SYNC_SHARED_SECRET) {
      return missingSecret();
    }

    if (!validateSecret(request)) {
      return unauthorized();
    }

    const payload = (await request.json()) as HealthCurrentStatsPayload;
    const result = await ctx.runMutation(api.health.ingestCurrentStats, payload);

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
