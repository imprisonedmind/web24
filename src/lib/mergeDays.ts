/* Merge two “days” arrays into one, ensure every date in range is present. */
import { eachDayOfInterval, formatISO, parseISO } from 'date-fns';

type DayEntry = { date: string; total: number; categories?: any[] };

export function mergeDays(
  wakaDays: DayEntry[],
  traktDays: DayEntry[],
) {
  const map: Record<string, { date: string; total: number; categories: any[] }> = {};

  const ensureCategories = (categories?: any[]) => (Array.isArray(categories) ? [...categories] : []);

  // 1️⃣  copy WakaTime first
  for (const d of wakaDays) {
    map[d.date] = {
      date: d.date,
      total: d.total,
      categories: ensureCategories(d.categories),
    };
  }

  // 2️⃣  merge Trakt
  for (const d of traktDays) {
    const categories = ensureCategories(d.categories);
    if (!map[d.date]) {
      map[d.date] = { date: d.date, total: d.total, categories };
    } else {
      map[d.date].total += d.total;
      for (const cat of categories) {
        const existing = map[d.date].categories.find(c => c.name === cat.name);
        existing ? (existing.total += cat.total) : map[d.date].categories.push(cat);
      }
    }
  }

  // 3️⃣  back-fill missing calendar days (shows grey squares)
  const sortedKeys = Object.keys(map).sort();
  if (!sortedKeys.length) return [];

  const start = parseISO(sortedKeys[0]);
  const end   = new Date();                                     // today
  for (const day of eachDayOfInterval({ start, end })) {
    const iso = formatISO(day, { representation: 'date' });
    if (!map[iso]) map[iso] = { date: iso, total: 0, categories: [] };
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}
