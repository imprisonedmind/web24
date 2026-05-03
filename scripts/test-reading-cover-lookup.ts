import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_BACKUP_PATH = path.join(process.env.HOME ?? "", "Downloads", "Backup.zip");

type BookRow = {
  book: string | null;
  author: string | null;
  filename: string;
  description: string | null;
  category: string | null;
};

type CoverResult = {
  provider: string;
  url: string;
  title?: string;
  author?: string;
};

type OpenLibrarySearchResponse = {
  docs?: {
    title?: string;
    author_name?: string[];
    cover_i?: number;
    isbn?: string[];
  }[];
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

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function run(command: string, args: string[], options?: { cwd?: string }) {
  const result = Bun.spawnSync([command, ...args], {
    cwd: options?.cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode !== 0) {
    throw new Error(
      `Command failed: ${command} ${args.join(" ")}\n${result.stderr.toString() || result.stdout.toString()}`,
    );
  }

  return result.stdout.toString();
}

async function extractDatabase(backupPath: string, tempDir: string) {
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

  const namesList = path.join(extractDir, "com.flyersoft.moonreaderp", "_names.list");
  const tagNames = (await readFile(namesList, "utf8")).split(/\r?\n/).filter(Boolean);
  const dbIndex = tagNames.findIndex((name) => name.endsWith("/databases/mrbooks.db"));
  if (dbIndex < 0) throw new Error("Moon+ backup did not contain mrbooks.db.");

  return path.join(extractDir, "com.flyersoft.moonreaderp", `${dbIndex + 1}.tag`);
}

function queryJson<T>(databasePath: string, sql: string): T[] {
  const output = run("sqlite3", ["-json", databasePath, sql]);
  return JSON.parse(output || "[]") as T[];
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

function queryHints(book: BookRow) {
  const text = [book.book, book.author, book.filename, book.description, book.category].filter(Boolean).join(" ");
  const hints = new Set<string>();

  if (/large language model|manning|raschka/i.test(text)) {
    hints.add("Manning");
  }

  return [...hints];
}

function isbnCandidates(text: string) {
  return Array.from(
    new Set(
      Array.from(text.matchAll(/(?:97[89][-\s]?)?\d[-\s]?\d{2,5}[-\s]?\d{2,7}[-\s]?\d{1,7}[-\s]?[\dX]/gi))
        .map((match) => match[0].replace(/[^\dX]/gi, ""))
        .filter((value) => value.length === 10 || value.length === 13),
    ),
  );
}

async function openLibraryByIsbn(isbn: string): Promise<CoverResult | undefined> {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  const response = await fetch(url, { method: "HEAD" });
  return response.ok ? { provider: `openlibrary:isbn:${isbn}`, url } : undefined;
}

async function openLibrarySearch(title: string, author?: string): Promise<CoverResult | undefined> {
  const params = new URLSearchParams({ title, limit: "5" });
  if (author) params.set("author", author);

  const response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
    headers: { "User-Agent": "web24-reading-cover-test/1.0" },
  });
  if (!response.ok) return undefined;

  const data = (await response.json()) as OpenLibrarySearchResponse;
  const match = data.docs?.find((doc) => typeof doc.cover_i === "number");
  if (!match?.cover_i) return undefined;

  return {
    provider: "openlibrary:search",
    url: `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`,
    title: match.title,
    author: match.author_name?.[0],
  };
}

async function fetchJsonWithRetry<T>(url: string, attempts = 3): Promise<T | undefined> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) return (await response.json()) as T;

    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts) {
      return undefined;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }

  return undefined;
}

async function googleBooksSearch(title: string, author?: string): Promise<CoverResult | undefined> {
  const query = [`intitle:${title}`, author ? `inauthor:${author}` : null].filter(Boolean).join("+");
  const params = new URLSearchParams({
    q: query,
    maxResults: "5",
    printType: "books",
  });
  const data = await fetchJsonWithRetry<GoogleBooksResponse>(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
  );
  if (!data) return undefined;
  const match = data.items?.find((item) => item.volumeInfo?.imageLinks?.thumbnail);
  const thumbnail = match?.volumeInfo?.imageLinks?.thumbnail;
  if (!thumbnail) return undefined;

  return {
    provider: "googlebooks:search",
    url: thumbnail.replace(/^http:/, "https:").replace("&edge=curl", ""),
    title: match.volumeInfo?.title,
    author: match.volumeInfo?.authors?.[0],
  };
}

async function resolveCover(book: BookRow) {
  const title = cleanTitle(book.book || titleFromFilename(book.filename));
  const author = cleanAuthor(book.author);
  const fallbackTitle = titleFromFilename(book.filename);
  const longFilenameTitle = cleanTitle(
    (book.filename.split("/").pop() ?? book.filename)
      .replace(/\.(epub|pdf|mobi)$/i, "")
      .replace(/\s*\([^)]*(z-library|1lib|z-lib)[^)]*\)\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
  const isbnText = [book.book, book.author, book.filename, book.description, book.category].filter(Boolean).join("\n");
  const hints = queryHints(book);

  for (const isbn of isbnCandidates(isbnText)) {
    const result = await openLibraryByIsbn(isbn);
    if (result) return { title, author, result };
  }

  for (const candidateTitle of Array.from(new Set([title, fallbackTitle, longFilenameTitle]))) {
    const openLibraryResult = await openLibrarySearch(candidateTitle, author);
    if (openLibraryResult) return { title, author, result: openLibraryResult };

    const googleBooksResult = await googleBooksSearch(candidateTitle, author);
    if (googleBooksResult) return { title, author, result: googleBooksResult };

    for (const hint of hints) {
      const hintedGoogleResult = await googleBooksSearch(`${candidateTitle} ${hint}`, author);
      if (hintedGoogleResult) return { title, author, result: hintedGoogleResult };
    }
  }

  return { title, author, result: undefined };
}

async function main() {
  const backupPath = argValue("--backup") ?? DEFAULT_BACKUP_PATH;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "reading-cover-test-"));

  try {
    const databasePath = await extractDatabase(backupPath, tempDir);
    const rows = queryJson<BookRow>(
      databasePath,
      "select book, author, filename, description, category from books order by _id",
    );

    const results = [];
    for (const row of rows) {
      results.push(await resolveCover(row));
    }

    const found = results.filter((row) => row.result);
    console.log(`Found covers for ${found.length}/${results.length} books\n`);
    for (const row of results) {
      console.log(`${row.result ? "OK" : "MISS"} ${row.title}${row.author ? ` — ${row.author}` : ""}`);
      if (row.result) {
        console.log(`  ${row.result.provider}: ${row.result.url}`);
        console.log(`  matched: ${row.result.title ?? "unknown"}${row.result.author ? ` — ${row.result.author}` : ""}`);
      }
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
