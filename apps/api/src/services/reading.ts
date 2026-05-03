import { listSyncedReadingActivity } from "../lib/convex";

const MIN_VISIBLE_READING_SECONDS = 60;
const MIN_VISIBLE_PROGRESS_PERCENT = 1;

export type ReadingStatus = {
  title: string;
  author?: string;
  coverUrl?: string;
  progressPercent: number;
  lastReadDate?: string;
  status: "completed" | "in_progress";
  totalReadingSeconds: number;
  totalWordsRead: number;
};

export type ReadingCardItem = {
  id: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  href: string;
  meta?: string;
};

export type ReadingSessionItem = ReadingCardItem & {
  date: string;
  readingSeconds: number;
  wordsRead: number;
  progressPercent: number;
};

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.round((safeSeconds % 3600) / 60);

  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function formatDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.valueOf())) return undefined;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: date.getUTCFullYear() !== new Date().getUTCFullYear() ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(date);
}

function bookHref(title: string, author?: string) {
  return `https://openlibrary.org/search?q=${encodeURIComponent(`${title} ${author ?? ""}`)}`;
}

function toBookCard(book: Awaited<ReturnType<typeof listSyncedReadingActivity>>["books"][number]): ReadingCardItem {
  return {
    id: book.sourceId,
    title: book.title,
    subtitle: book.author,
    coverUrl: book.coverUrl,
    href: bookHref(book.title, book.author),
    meta: [
      `${Math.round(book.progressPercent)}%`,
      formatDuration(book.totalReadingSeconds),
      book.lastReadDate ? `last read ${formatDate(book.lastReadDate)}` : null,
    ].filter(Boolean).join(" • "),
  };
}

export async function getCurrentReading() {
  const activity = await listSyncedReadingActivity();
  const books = [...activity.books].sort((left, right) => {
    const leftDate = left.lastReadDate ?? "";
    const rightDate = right.lastReadDate ?? "";
    if (leftDate !== rightDate) return rightDate.localeCompare(leftDate);
    return right.totalReadingSeconds - left.totalReadingSeconds;
  });
  const active = books.find((book) => book.status === "in_progress") ?? books[0];

  if (!active) return null;

  return {
    title: active.title,
    author: active.author,
    coverUrl: active.coverUrl,
    progressPercent: active.progressPercent,
    lastReadDate: active.lastReadDate,
    status: active.status,
    totalReadingSeconds: active.totalReadingSeconds,
    totalWordsRead: active.totalWordsRead,
  } satisfies ReadingStatus;
}

export async function getCurrentlyReadingBooks(limit = 12) {
  const activity = await listSyncedReadingActivity();
  return activity.books
    .filter((book) =>
      book.status === "in_progress" &&
      book.totalReadingSeconds >= MIN_VISIBLE_READING_SECONDS &&
      book.progressPercent >= MIN_VISIBLE_PROGRESS_PERCENT
    )
    .sort((left, right) => {
      const leftDate = left.lastReadDate ?? "";
      const rightDate = right.lastReadDate ?? "";
      if (leftDate !== rightDate) return rightDate.localeCompare(leftDate);
      return right.progressPercent - left.progressPercent;
    })
    .slice(0, limit)
    .map(toBookCard);
}

export async function getFinishedReadingBooks(limit = 12) {
  const activity = await listSyncedReadingActivity();
  return activity.books
    .filter((book) => book.status === "completed")
    .sort((left, right) => {
      const leftDate = left.lastReadDate ?? "";
      const rightDate = right.lastReadDate ?? "";
      if (leftDate !== rightDate) return rightDate.localeCompare(leftDate);
      return right.totalReadingSeconds - left.totalReadingSeconds;
    })
    .slice(0, limit)
    .map(toBookCard);
}

export async function getRecentReadingSessions(limit = 12) {
  const activity = await listSyncedReadingActivity();
  const bookBySourceId = new Map(activity.books.map((book) => [book.sourceId, book]));

  return activity.bookDailyActivity
    .filter((session) =>
      session.readingSeconds >= MIN_VISIBLE_READING_SECONDS &&
      session.progressPercent >= MIN_VISIBLE_PROGRESS_PERCENT
    )
    .sort((left, right) => {
      if (left.date !== right.date) return right.date.localeCompare(left.date);
      return right.readingSeconds - left.readingSeconds;
    })
    .slice(0, limit)
    .map((session) => {
      const book = bookBySourceId.get(session.sourceId);
      return {
        id: `${session.sourceId}-${session.date}`,
        title: session.title,
        subtitle: book?.author,
        coverUrl: book?.coverUrl,
        href: bookHref(session.title, book?.author),
        date: session.date,
        readingSeconds: session.readingSeconds,
        wordsRead: session.wordsRead,
        progressPercent: session.progressPercent,
        meta: `${formatDuration(session.readingSeconds)} read • ${Math.round(session.wordsRead).toLocaleString()} words • ${formatDate(session.date)}`,
      } satisfies ReadingSessionItem;
    });
}
