import { cronJobs } from "convex/server";

import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync trakt recent history",
  { hours: 3 },
  api.trakt.runRecentSync,
  { windowHours: 72 },
);

crons.interval(
  "sync wakatime coding activity",
  { hours: 1 },
  api.coding.syncWakaTime,
  {},
);

export default crons;
