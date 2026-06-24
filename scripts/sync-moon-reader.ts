import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import {
  envEntriesToObject,
  readEnvEntries,
  updateEnvFile,
} from "../packages/config/src/envFile";

const ENV_PATH = path.join(process.cwd(), ".env.local");
const DEFAULT_BACKUP_PATH = path.join(
  process.env.HOME ?? "",
  "Downloads",
  "Backup.zip",
);
const DEFAULT_DROPBOX_BACKUP_FOLDER = "/Apps/Books/.Moon+/Backup";
const SOURCE = "moon-reader";
const LOCAL_TIME_ZONE =
  process.env.MOON_READER_TIME_ZONE ?? "Africa/Johannesburg";

type EnvRecord = Record<string, string>;

type DropboxListResponse = {
  entries: {
    ".tag": "file" | "folder" | "deleted";
    name: string;
    path_lower?: string;
    path_display?: string;
    client_modified?: string;
    server_modified?: string;
    content_hash?: string;
  }[];
};

type DropboxTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
};

type StatisticsRow = {
  filename: string;
  usedTime: number;
  readWords: number;
  dates: string | null;
};

type BookRow = {
  filename: string;
  book: string | null;
  author: string | null;
  category: string | null;
};

type OpenLibrarySearchResponse = {
  docs?: {
    key?: string;
    title?: string;
    author_name?: string[];
    cover_i?: number;
    cover_edition_key?: string;
    edition_key?: string[];
    isbn?: string[];
  }[];
};

type OpenLibraryWorkResponse = {
  covers?: number[];
};

type GoogleBooksResponse = {
  items?: {
    volumeInfo?: {
      title?: string;
      authors?: string[];
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
    };
  }[];
};

type ParsedBookDailyRow = {
  sourceId: string;
  date: string;
  title: string;
  filename: string;
  readingSeconds: number;
  wordsRead: number;
  progressPercent: number;
  source: string;
  updatedAtMs: number;
};

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasArg(name: string) {
  return process.argv.includes(name);
}

function logStep(message: string) {
  console.error(`[sync-moon-reader] ${message}`);
}

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

async function loadEnv() {
  const entries = await readEnvEntries(ENV_PATH);
  return envEntriesToObject(entries);
}

function pickEnv(env: EnvRecord, key: string) {
  return (
    env[key] ??
    process.env[key] ??
    env[key.toLowerCase()] ??
    env[key.toUpperCase()]
  );
}

async function refreshDropboxAccessToken(env: EnvRecord) {
  const refreshToken = pickEnv(env, "DROPBOX_REFRESH_TOKEN");
  const appKey = pickEnv(env, "DROPBOX_APP_KEY");
  const appSecret = pickEnv(env, "DROPBOX_APP_SECRET");

  if (!refreshToken || !appKey || !appSecret) {
    fail(
      "Missing Dropbox auth. Set DROPBOX_ACCESS_TOKEN, or DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET in .env.local.",
    );
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${appKey}:${appSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    fail(
      `Failed to refresh Dropbox token (${res.status}): ${await res.text()}`,
    );
  }

  const data = (await res.json()) as DropboxTokenResponse;
  if (!data.access_token)
    fail("Dropbox refresh response did not include access_token.");

  const createdAt = Math.floor(Date.now() / 1000);
  const updates: Record<string, string | undefined> = {
    DROPBOX_ACCESS_TOKEN: data.access_token,
    DROPBOX_TOKEN_CREATED_AT: String(createdAt),
    DROPBOX_TOKEN_EXPIRES_AT: data.expires_in
      ? String(createdAt + data.expires_in)
      : undefined,
    DROPBOX_TOKEN_TYPE: data.token_type,
  };

  const nextEnv = await updateEnvFile(updates, ENV_PATH);
  Object.assign(env, nextEnv);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  logStep("Refreshed Dropbox access token and updated .env.local");
  return data.access_token;
}

async function getDropboxAccessToken(env: EnvRecord) {
  const accessToken = pickEnv(env, "DROPBOX_ACCESS_TOKEN");
  if (accessToken) return accessToken;

  return refreshDropboxAccessToken(env);
}

function isExpiredDropboxAccessToken(status: number, body: string) {
  return status === 401 && body.includes("expired_access_token");
}

async function fetchDropboxWithTokenRefresh(
  env: EnvRecord,
  accessToken: string,
  request: (token: string) => Promise<Response>,
) {
  const res = await request(accessToken);
  if (res.ok) return { res, accessToken };

  const body = await res.text();
  if (!isExpiredDropboxAccessToken(res.status, body)) {
    return { res, accessToken, body };
  }

  logStep("Dropbox access token expired; refreshing");
  const refreshedToken = await refreshDropboxAccessToken(env);
  const retry = await request(refreshedToken);
  if (retry.ok) return { res: retry, accessToken: refreshedToken };

  return { res: retry, accessToken: refreshedToken, body: await retry.text() };
}

async function findLatestDropboxBackup(env: EnvRecord, accessToken: string) {
  const folder =
    argValue("--dropbox-folder") ??
    pickEnv(env, "DROPBOX_MOON_READER_BACKUP_FOLDER") ??
    DEFAULT_DROPBOX_BACKUP_FOLDER;
  const {
    res,
    accessToken: latestAccessToken,
    body,
  } = await fetchDropboxWithTokenRefresh(env, accessToken, (token) =>
    fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: folder }),
    }),
  );

  if (!res.ok) {
    fail(
      `Failed to list Dropbox folder '${folder}' (${res.status}): ${body ?? (await res.text())}`,
    );
  }

  const data = (await res.json()) as DropboxListResponse;
  const backups = data.entries
    .filter((entry) => entry[".tag"] === "file")
    .filter((entry) => /\.(zip|mrpro)$/i.test(entry.name))
    .sort((left, right) =>
      (right.client_modified ?? right.server_modified ?? "").localeCompare(
        left.client_modified ?? left.server_modified ?? "",
      ),
    );

  if (backups.length === 0) {
    fail(
      `No .zip or .mrpro Moon+ backups found in Dropbox folder '${folder}'.`,
    );
  }

  return { ...backups[0], accessToken: latestAccessToken };
}

async function downloadDropboxFile(
  env: EnvRecord,
  accessToken: string,
  dropboxPath: string,
  destination: string,
) {
  const { res, body } = await fetchDropboxWithTokenRefresh(
    env,
    accessToken,
    (token) =>
      fetch("https://content.dropboxapi.com/2/files/download", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Dropbox-API-Arg": JSON.stringify({ path: dropboxPath }),
        },
      }),
  );

  if (!res.ok) {
    fail(
      `Failed to download Dropbox backup '${dropboxPath}' (${res.status}): ${body ?? (await res.text())}`,
    );
  }

  await writeFile(destination, Buffer.from(await res.arrayBuffer()));
}

function run(command: string, args: string[], options?: { cwd?: string }) {
  const result = Bun.spawnSync([command, ...args], {
    cwd: options?.cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode !== 0) {
    fail(
      `Command failed: ${command} ${args.join(" ")}\n${result.stderr.toString() || result.stdout.toString()}`,
    );
  }

  return result.stdout.toString();
}

async function extractBackup(backupPath: string, tempDir: string) {
  const backupFile = path.join(tempDir, "backup-input");
  await writeFile(backupFile, await readFile(backupPath));

  const firstList = run("unzip", ["-Z1", backupFile]);
  const mrproEntry = firstList
    .split(/\r?\n/)
    .find((entry) => entry.toLowerCase().endsWith(".mrpro"));

  let mrproPath = backupFile;

  if (mrproEntry) {
    run("unzip", ["-q", backupFile, mrproEntry, "-d", tempDir]);
    mrproPath = path.join(tempDir, mrproEntry);
  }

  const extractDir = path.join(tempDir, "moon-reader");
  run("unzip", ["-q", mrproPath, "-d", extractDir]);

  const namesList = path.join(
    extractDir,
    "com.flyersoft.moonreaderp",
    "_names.list",
  );
  const tagNames = (await readFile(namesList, "utf8"))
    .split(/\r?\n/)
    .filter(Boolean);
  const dbIndex = tagNames.findIndex((name) =>
    name.endsWith("/databases/mrbooks.db"),
  );

  if (dbIndex < 0) {
    fail(
      "Moon+ backup did not contain com.flyersoft.moonreaderp/databases/mrbooks.db.",
    );
  }

  return {
    databasePath: path.join(
      extractDir,
      "com.flyersoft.moonreaderp",
      `${dbIndex + 1}.tag`,
    ),
  };
}

function queryJson<T>(databasePath: string, sql: string): T[] {
  const output = run("sqlite3", ["-json", databasePath, sql]);
  return JSON.parse(output || "[]") as T[];
}

function basename(filename: string) {
  return filename.split("/").pop() ?? filename;
}

function stableSourceId(filename: string) {
  return createHash("sha256")
    .update(filename.toLowerCase())
    .digest("hex")
    .slice(0, 24);
}

function cleanAuthor(author?: string | null) {
  return author?.split(";")[0].replace(/\s+/g, " ").trim() || undefined;
}

function cleanTitle(title: string) {
  return title
    .replace(/\s*:\s*A Novel$/i, "")
    .replace(/\s*\([^)]*(z-library|1lib|z-lib)[^)]*\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromFilename(filename: string) {
  return cleanTitle(
    (filename.split("/").pop() ?? filename)
      .replace(/\.(epub|pdf|mobi)$/i, "")
      .replace(/\([^)]*\)/g, " ")
      .replace(/\bZ-Library\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function titleWithoutSeriesSubtitle(title: string) {
  const [primaryTitle] = title.split(/\s*:\s*/);
  return cleanTitle(primaryTitle ?? title);
}

function queryHints(book: {
  book: string | null;
  author: string | null;
  filename: string;
  description: string | null;
  category: string | null;
}) {
  const text = [
    book.book,
    book.author,
    book.filename,
    book.description,
    book.category,
  ]
    .filter(Boolean)
    .join(" ");
  const hints = new Set<string>();

  if (/large language model|manning|raschka/i.test(text)) {
    hints.add("Manning");
  }

  return [...hints];
}

function isbnCandidates(text: string) {
  return Array.from(
    new Set(
      Array.from(
        text.matchAll(
          /(?:97[89][-\s]?)?\d[-\s]?\d{2,5}[-\s]?\d{2,7}[-\s]?\d{1,7}[-\s]?[\dX]/gi,
        ),
      )
        .map((match) => match[0].replace(/[^\dX]/gi, ""))
        .filter((value) => value.length === 10 || value.length === 13),
    ),
  );
}

async function openLibraryByIsbn(
  isbn: string,
): Promise<{ provider: string; url: string } | undefined> {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  const response = await fetch(url, { method: "HEAD" });
  return response.ok
    ? { provider: `openlibrary:isbn:${isbn}`, url }
    : undefined;
}

async function openLibraryByEditionKey(
  editionKey: string,
): Promise<{ provider: string; url: string } | undefined> {
  const url = `https://covers.openlibrary.org/b/olid/${editionKey}-L.jpg?default=false`;
  const response = await fetch(url, { method: "HEAD" });
  return response.ok
    ? { provider: `openlibrary:olid:${editionKey}`, url }
    : undefined;
}

async function fetchJsonWithRetry<T>(
  url: string,
  attempts = 3,
): Promise<T | undefined> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) return (await response.json()) as T;

    if (
      ![429, 500, 502, 503, 504].includes(response.status) ||
      attempt === attempts
    ) {
      return undefined;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }

  return undefined;
}

async function googleBooksSearch(
  title: string,
  author?: string,
): Promise<
  { provider: string; url: string; title?: string; author?: string } | undefined
> {
  const query = [`intitle:${title}`, author ? `inauthor:${author}` : null]
    .filter(Boolean)
    .join("+");
  const params = new URLSearchParams({
    q: query,
    maxResults: "5",
    printType: "books",
  });
  const data = await fetchJsonWithRetry<GoogleBooksResponse>(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
  );
  if (!data) return undefined;
  const match = data.items?.find(
    (item) => item.volumeInfo?.imageLinks?.thumbnail,
  );
  const thumbnail = match?.volumeInfo?.imageLinks?.thumbnail;
  if (!thumbnail) return undefined;

  return {
    provider: "googlebooks:search",
    url: thumbnail.replace(/^http:/, "https:").replace("&edge=curl", ""),
    title: match.volumeInfo?.title,
    author: match.volumeInfo?.authors?.[0],
  };
}

async function resolveBookCoverUrl(
  book: {
    book: string | null;
    author: string | null;
    filename: string;
    description: string | null;
    category: string | null;
  },
  title: string,
  author?: string | null,
) {
  const cleanedTitle = cleanTitle(title);
  const cleanedAuthor = cleanAuthor(author);
  const fallbackTitle = titleFromFilename(book.filename);
  const longFilenameTitle = cleanTitle(
    (book.filename.split("/").pop() ?? book.filename)
      .replace(/\.(epub|pdf|mobi)$/i, "")
      .replace(/\s*\([^)]*(z-library|1lib|z-lib)[^)]*\)\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
  const isbnText = [
    book.book,
    book.author,
    book.filename,
    book.description,
    book.category,
  ]
    .filter(Boolean)
    .join("\n");
  const hints = queryHints(book);

  const openLibrarySearch = async (
    searchTitle: string,
    searchAuthor?: string,
  ) => {
    const params = new URLSearchParams({ title: searchTitle, limit: "5" });
    if (searchAuthor) params.set("author", searchAuthor);

    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?${params.toString()}`,
        {
          headers: {
            "User-Agent": "web24-moon-reader-sync/1.0",
          },
        },
      );

      if (!res.ok) return undefined;

      const data = (await res.json()) as OpenLibrarySearchResponse;
      const match = data.docs?.find((doc) => typeof doc.cover_i === "number");
      if (match?.cover_i) {
        return {
          provider: "openlibrary:search",
          url: `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`,
        };
      }

      const editionKeys =
        data.docs?.flatMap((doc) =>
          [doc.cover_edition_key, ...(doc.edition_key ?? [])].filter(
            (key): key is string => Boolean(key),
          ),
        ) ?? [];
      for (const editionKey of Array.from(new Set(editionKeys))) {
        const editionResult = await openLibraryByEditionKey(editionKey);
        if (editionResult) return editionResult;
      }

      const workKeys =
        data.docs
          ?.map((doc) => doc.key)
          .filter(
            (key): key is string => key?.startsWith("/works/") ?? false,
          ) ?? [];
      for (const workKey of Array.from(new Set(workKeys))) {
        const work = await fetchJsonWithRetry<OpenLibraryWorkResponse>(
          `https://openlibrary.org${workKey}.json`,
        );
        const coverId = work?.covers?.find((cover) => cover > 0);
        if (coverId) {
          return {
            provider: "openlibrary:work",
            url: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
          };
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  };

  for (const isbn of isbnCandidates(isbnText)) {
    const result = await openLibraryByIsbn(isbn);
    if (result) return result.url;
  }

  for (const candidateTitle of Array.from(
    new Set([
      cleanedTitle,
      titleWithoutSeriesSubtitle(cleanedTitle),
      fallbackTitle,
      titleWithoutSeriesSubtitle(fallbackTitle),
      longFilenameTitle,
      titleWithoutSeriesSubtitle(longFilenameTitle),
    ]),
  )) {
    const openLibraryResult = await openLibrarySearch(
      candidateTitle,
      cleanedAuthor,
    );
    if (openLibraryResult) return openLibraryResult.url;

    const googleBooksResult = await googleBooksSearch(
      candidateTitle,
      cleanedAuthor,
    );
    if (googleBooksResult) return googleBooksResult.url;

    for (const hint of hints) {
      const hintedGoogleResult = await googleBooksSearch(
        `${candidateTitle} ${hint}`,
        cleanedAuthor,
      );
      if (hintedGoogleResult) return hintedGoogleResult.url;
    }
  }

  return undefined;
}

function parseProgressPercent(progress: string | undefined) {
  if (!progress) return 0;
  const parsed = Number(progress.replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateFromMoonDay(dayNumber: number) {
  // Moon+ stores local-day numbers and then adds the local-midnight UTC offset
  // when rendering dates. Africa/Johannesburg is UTC+02 with no DST, so local
  // midnight is 22:00 UTC on the previous UTC day.
  const dayOffsetMs = 22 * 60 * 60 * 1000;
  const date = new Date(dayNumber * 86_400_000 + dayOffsetMs);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LOCAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return [
    parts.find((part) => part.type === "year")?.value,
    parts.find((part) => part.type === "month")?.value,
    parts.find((part) => part.type === "day")?.value,
  ].join("-");
}

function parseDatesField(
  row: StatisticsRow,
  title: string,
  updatedAtMs: number,
) {
  const sourceId = stableSourceId(row.filename);
  const entries: ParsedBookDailyRow[] = [];

  for (const line of row.dates?.split(/\r?\n/) ?? []) {
    const match = line.trim().match(/^(\d+)\|(\d+)@(\d+)(?:\s+#(.+))?$/);
    if (!match) continue;

    const [, day, readingMs, words, progress] = match;
    entries.push({
      sourceId,
      date: dateFromMoonDay(Number(day)),
      title,
      filename: row.filename,
      readingSeconds: Math.round(Number(readingMs) / 1000),
      wordsRead: Number(words),
      progressPercent: parseProgressPercent(progress),
      source: SOURCE,
      updatedAtMs,
    });
  }

  return entries;
}

async function parseMoonReaderBackup(
  backupPath: string,
  metadata: {
    backupPath?: string;
    backupModifiedAt?: string;
    backupContentHash?: string;
  },
) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "moon-reader-sync-"));

  try {
    const { databasePath } = await extractBackup(backupPath, tempDir);
    const updatedAtMs = Date.now();
    const stats = queryJson<StatisticsRow>(
      databasePath,
      "select filename, usedTime, readWords, dates from statistics order by _id",
    );
    const books = queryJson<BookRow>(
      databasePath,
      "select filename, book, author, category from books",
    );
    const bookMetadataByFilename = new Map(
      books.map((book) => [book.filename, book]),
    );
    const allBookDailyRows: ParsedBookDailyRow[] = [];

    const parsedBooks = await Promise.all(
      stats.map(async (row) => {
        const metadataRow = bookMetadataByFilename.get(row.filename);
        const title =
          metadataRow?.book ||
          basename(row.filename).replace(/\.(epub|pdf|mobi)$/i, "");
        const bookDailyRows = parseDatesField(row, title, updatedAtMs);
        allBookDailyRows.push(...bookDailyRows);
        const progressPercent = bookDailyRows.at(-1)?.progressPercent ?? 0;
        const dates = bookDailyRows.map((entry) => entry.date);

        return {
          source: SOURCE,
          sourceId: stableSourceId(row.filename),
          title,
          filename: row.filename,
          author: metadataRow?.author || undefined,
          category: metadataRow?.category || undefined,
          coverUrl: await resolveBookCoverUrl(
            metadataRow ?? {
              filename: row.filename,
              book: null,
              author: null,
              description: null,
              category: null,
            },
            title,
            metadataRow?.author,
          ),
          status:
            progressPercent >= 100
              ? ("completed" as const)
              : ("in_progress" as const),
          progressPercent,
          totalReadingSeconds: Math.round(row.usedTime / 1000),
          totalWordsRead: row.readWords,
          activeDays: bookDailyRows.length,
          firstReadDate: dates[0],
          lastReadDate: dates.at(-1),
          updatedAtMs,
        };
      }),
    );

    const dailyMap = new Map<
      string,
      { seconds: number; words: number; sourceIds: Set<string> }
    >();
    for (const row of allBookDailyRows) {
      const existing = dailyMap.get(row.date) ?? {
        seconds: 0,
        words: 0,
        sourceIds: new Set<string>(),
      };
      existing.seconds += row.readingSeconds;
      existing.words += row.wordsRead;
      existing.sourceIds.add(row.sourceId);
      dailyMap.set(row.date, existing);
    }

    const dailyActivity = Array.from(dailyMap.entries())
      .map(([date, row]) => ({
        date,
        totalReadingSeconds: row.seconds,
        totalWordsRead: row.words,
        bookCount: row.sourceIds.size,
        source: SOURCE,
        updatedAtMs,
      }))
      .sort((left, right) => left.date.localeCompare(right.date));

    return {
      source: SOURCE,
      ...metadata,
      books: parsedBooks,
      dailyActivity,
      bookDailyActivity: allBookDailyRows.sort((left, right) =>
        left.date === right.date
          ? left.title.localeCompare(right.title)
          : left.date.localeCompare(right.date),
      ),
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function resolveBackup(
  env: EnvRecord,
  options?: { skipContentHash?: string },
) {
  const explicitBackup =
    argValue("--backup") ?? pickEnv(env, "MOON_READER_BACKUP_PATH");
  if (explicitBackup || hasArg("--local")) {
    const backupPath = explicitBackup ?? DEFAULT_BACKUP_PATH;
    return {
      localPath: backupPath,
      metadata: {
        backupPath,
      },
    };
  }

  const accessToken = await getDropboxAccessToken(env);
  const latestBackup = await findLatestDropboxBackup(env, accessToken);
  const metadata = {
    backupPath: latestBackup.path_display ?? latestBackup.path_lower,
    backupModifiedAt:
      latestBackup.client_modified ?? latestBackup.server_modified,
    backupContentHash: latestBackup.content_hash,
  };

  if (
    options?.skipContentHash &&
    metadata.backupContentHash === options.skipContentHash
  ) {
    return {
      skipped: true,
      metadata,
    };
  }

  const localPath = path.join(
    await mkdtemp(path.join(os.tmpdir(), "moon-reader-dropbox-")),
    latestBackup.name,
  );

  await downloadDropboxFile(
    env,
    latestBackup.accessToken,
    latestBackup.path_lower ?? latestBackup.path_display ?? latestBackup.name,
    localPath,
  );

  return {
    localPath,
    metadata,
  };
}

async function getCurrentSyncState(client: ConvexHttpClient) {
  const activity = await client.query(api.reading.listReadingActivity, {});
  return activity.state;
}

async function main() {
  const env = await loadEnv();
  const convexUrl = argValue("--convex-url") ?? pickEnv(env, "CONVEX_URL");
  if (!convexUrl) fail("Missing CONVEX_URL in .env.local");
  const dryRun = hasArg("--dry-run");
  const force = hasArg("--force");
  const client = new ConvexHttpClient(convexUrl);
  const currentState =
    !dryRun && !force ? await getCurrentSyncState(client) : null;
  const backup = await resolveBackup(env, {
    skipContentHash: currentState?.backupContentHash,
  });

  if ("skipped" in backup) {
    logStep(
      `Latest Dropbox backup is unchanged (${backup.metadata.backupPath ?? backup.metadata.backupContentHash}); skipping ingest. Use --force to reprocess.`,
    );
    return;
  }

  const { localPath, metadata } = backup;
  logStep(`Parsing ${localPath}`);
  const payload = await parseMoonReaderBackup(localPath, metadata);
  logStep(
    `Parsed ${payload.books.length} books, ${payload.dailyActivity.length} daily rows, ${payload.bookDailyActivity.length} book-day rows`,
  );

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const result = await client.mutation(
    api.reading.ingestMoonReaderBackup,
    payload,
  );
  logStep(`Convex ingest complete: ${JSON.stringify(result)}`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
