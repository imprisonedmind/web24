import { afterAll, describe, test } from "bun:test";

import { siteConfig } from "@web24/config";
import { getTopWritingPosts } from "../../../packages/content/src/writing";

const BASE_URL = siteConfig.url;

type EndpointSpec = {
  name: string;
  path: string;
};

type RequestProfile = {
  name: string;
  path: string;
  status: number;
  durationMs: number;
  responseBytes: number;
};

type RequestGroupProfile = {
  name: string;
  durationMs: number;
  requests: RequestProfile[];
};

const homeFirstPaintEndpoints: EndpointSpec[] = [
  {
    name: "activity:home",
    path: "/api/activity/home",
  },
  {
    name: "tv:status",
    path: "/api/tv/status",
  },
  {
    name: "music:currently-playing",
    path: "/api/currentlyPlaying",
  },
];

const watchedFirstPaintEndpoints: EndpointSpec[] = [
  {
    name: "watched:recent",
    path: "/api/watched/recent?limit=12",
  },
  {
    name: "watched:month",
    path: "/api/watched/month?limit=12",
  },
  {
    name: "watched:all-time",
    path: "/api/watched/all-time?limit=12",
  },
];

const writingPost = getTopWritingPosts(1)[0];

const secondaryEndpoints: EndpointSpec[] = [
  {
    name: "activity:full",
    path: "/api/activity/full",
  },
  {
    name: "activity:watching",
    path: "/api/activity/watching",
  },
  {
    name: "activity:work",
    path: "/api/activity/work",
  },
  {
    name: "watched:monthly",
    path: `/api/watched/monthly?monthIso=${currentMonthIso()}&limit=12`,
  },
  {
    name: "writing:detail",
    path: `/api/writing/${writingPost.id}`,
  },
];

const requestProfiles: RequestProfile[] = [];
const groupProfiles: RequestGroupProfile[] = [];

describe("production API request latency", () => {
  for (const endpoint of [...homeFirstPaintEndpoints, ...watchedFirstPaintEndpoints, ...secondaryEndpoints]) {
    test(endpoint.name, async () => {
      const profile = await profileEndpoint(endpoint);
      requestProfiles.push(profile);
      printRequestProfile(profile);
    });
  }

  test("home first paint bundle", async () => {
    const profile = await profileGroup("home first paint", homeFirstPaintEndpoints);
    groupProfiles.push(profile);
    printGroupProfile(profile);
  });

  test("watched first paint bundle", async () => {
    const profile = await profileGroup("watched first paint", watchedFirstPaintEndpoints);
    groupProfiles.push(profile);
    printGroupProfile(profile);
  });
});

afterAll(() => {
  printSummary();
});

function currentMonthIso() {
  return new Date().toISOString().slice(0, 7);
}

async function profileGroup(name: string, endpoints: EndpointSpec[]): Promise<RequestGroupProfile> {
  const startedAt = performance.now();
  const requests = await Promise.all(endpoints.map(profileEndpoint));
  const durationMs = performance.now() - startedAt;

  return {
    name,
    durationMs,
    requests,
  };
}

async function profileEndpoint(endpoint: EndpointSpec): Promise<RequestProfile> {
  const startedAt = performance.now();
  const response = await fetch(new URL(endpoint.path, BASE_URL).toString());
  const bodyText = await response.text();
  const durationMs = performance.now() - startedAt;

  return {
    name: endpoint.name,
    path: endpoint.path,
    status: response.status,
    durationMs,
    responseBytes: new TextEncoder().encode(bodyText).byteLength,
  };
}

function printRequestProfile(request: RequestProfile) {
  console.log(
    [
      `[api-latency] ${request.name}`,
      `status=${request.status}`,
      `duration=${formatMs(request.durationMs)}`,
      `size=${request.responseBytes}B`,
      `url=${new URL(request.path, BASE_URL).toString()}`,
    ].join(" | "),
  );
}

function printGroupProfile(group: RequestGroupProfile) {
  console.log(`\n[api-latency] ${group.name}: ${formatMs(group.durationMs)} total`);
  for (const request of sortSlowestFirst(group.requests)) {
    console.log(
      [
        `  ${request.name}`,
        `status=${request.status}`,
        `duration=${formatMs(request.durationMs)}`,
        `size=${request.responseBytes}B`,
      ].join(" | "),
    );
  }
}

function printSummary() {
  if (requestProfiles.length === 0) return;

  console.log(`\n[api-latency] production summary for ${BASE_URL}`);
  for (const request of sortSlowestFirst(requestProfiles)) {
    console.log(
      [
        `  ${request.name}`,
        `status=${request.status}`,
        `duration=${formatMs(request.durationMs)}`,
        `size=${request.responseBytes}B`,
      ].join(" | "),
    );
  }

  if (groupProfiles.length > 0) {
    console.log("\n[api-latency] grouped first-paint summary");
    for (const group of [...groupProfiles].sort((left, right) => right.durationMs - left.durationMs)) {
      console.log(`  ${group.name} | duration=${formatMs(group.durationMs)}`);
    }
  }
}

function sortSlowestFirst(requests: RequestProfile[]) {
  return [...requests].sort((left, right) => right.durationMs - left.durationMs);
}

function formatMs(value: number) {
  return `${value.toFixed(value >= 100 ? 0 : 1)}ms`;
}
