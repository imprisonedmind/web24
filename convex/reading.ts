import { v } from "convex/values";

import { mutation, query, type MutationCtx } from "./_generated/server";

const STATE_KEY = "moon-reader";

const readingBookValidator = v.object({
  source: v.string(),
  sourceId: v.string(),
  title: v.string(),
  filename: v.string(),
  author: v.optional(v.string()),
  category: v.optional(v.string()),
  coverUrl: v.optional(v.string()),
  status: v.union(v.literal("completed"), v.literal("in_progress")),
  progressPercent: v.number(),
  totalReadingSeconds: v.number(),
  totalWordsRead: v.number(),
  activeDays: v.number(),
  firstReadDate: v.optional(v.string()),
  lastReadDate: v.optional(v.string()),
  updatedAtMs: v.number(),
});

const readingDailyActivityValidator = v.object({
  date: v.string(),
  totalReadingSeconds: v.number(),
  totalWordsRead: v.number(),
  bookCount: v.number(),
  source: v.string(),
  updatedAtMs: v.number(),
});

const readingBookDailyActivityValidator = v.object({
  sourceId: v.string(),
  date: v.string(),
  title: v.string(),
  filename: v.string(),
  readingSeconds: v.number(),
  wordsRead: v.number(),
  progressPercent: v.number(),
  source: v.string(),
  updatedAtMs: v.number(),
});

async function deleteAllRows(ctx: MutationCtx, tableName: Parameters<typeof ctx.db.query>[0]) {
  let deleted = 0;

  while (true) {
    const rows = await ctx.db.query(tableName).take(100);
    if (rows.length === 0) return deleted;

    for (const row of rows) {
      await ctx.db.delete(row._id);
      deleted += 1;
    }
  }
}

export const ingestMoonReaderBackup = mutation({
  args: {
    source: v.string(),
    backupPath: v.optional(v.string()),
    backupModifiedAt: v.optional(v.string()),
    backupContentHash: v.optional(v.string()),
    books: v.array(readingBookValidator),
    dailyActivity: v.array(readingDailyActivityValidator),
    bookDailyActivity: v.array(readingBookDailyActivityValidator),
  },
  handler: async (ctx, args) => {
    const [deletedBooks, deletedDailyRows, deletedBookDailyRows] = await Promise.all([
      deleteAllRows(ctx, "readingBooks"),
      deleteAllRows(ctx, "readingDailyActivity"),
      deleteAllRows(ctx, "readingBookDailyActivity"),
    ]);

    for (const row of args.books) {
      await ctx.db.insert("readingBooks", row);
    }

    for (const row of args.dailyActivity) {
      await ctx.db.insert("readingDailyActivity", row);
    }

    for (const row of args.bookDailyActivity) {
      await ctx.db.insert("readingBookDailyActivity", row);
    }

    const state = {
      key: STATE_KEY,
      source: args.source,
      syncedAtMs: Date.now(),
      backupPath: args.backupPath,
      backupModifiedAt: args.backupModifiedAt,
      backupContentHash: args.backupContentHash,
      books: args.books.length,
      dailyRows: args.dailyActivity.length,
      bookDailyRows: args.bookDailyActivity.length,
    };

    const existing = await ctx.db
      .query("readingSyncState")
      .withIndex("by_key", (q) => q.eq("key", STATE_KEY))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, state);
    } else {
      await ctx.db.insert("readingSyncState", state);
    }

    return {
      deletedBooks,
      deletedDailyRows,
      deletedBookDailyRows,
      insertedBooks: args.books.length,
      insertedDailyRows: args.dailyActivity.length,
      insertedBookDailyRows: args.bookDailyActivity.length,
      syncedAtMs: state.syncedAtMs,
    };
  },
});

export const listReadingActivity = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [books, dailyActivity, bookDailyActivity, state] = await Promise.all([
      ctx.db.query("readingBooks").collect(),
      ctx.db.query("readingDailyActivity").withIndex("by_date").collect(),
      ctx.db.query("readingBookDailyActivity").withIndex("by_date").collect(),
      ctx.db
        .query("readingSyncState")
        .withIndex("by_key", (q) => q.eq("key", STATE_KEY))
        .unique(),
    ]);
    const inWindow = (date: string) =>
      (!args.startDate || date >= args.startDate) && (!args.endDate || date <= args.endDate);

    return {
      books: books.sort((left, right) => right.totalReadingSeconds - left.totalReadingSeconds),
      dailyActivity: dailyActivity.filter((row) => inWindow(row.date)),
      bookDailyActivity: bookDailyActivity.filter((row) => inWindow(row.date)),
      state,
    };
  },
});

export const getSyncVersion = query({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db
      .query("readingSyncState")
      .withIndex("by_key", (q) => q.eq("key", STATE_KEY))
      .unique();

    if (!state) return "empty";
    return `${state.syncedAtMs}:${state.books}:${state.dailyRows}:${state.bookDailyRows}`;
  },
});
