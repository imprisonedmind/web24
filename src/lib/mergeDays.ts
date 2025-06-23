/* Merge two “days” arrays into one, ensure every date in range is present. */
import { eachDayOfInterval, formatISO, parseISO } from 'date-fns';

export function mergeDays(
  wakaDays: { date: string; total: number; categories: any[] }[],
  traktDays: { date: string; total: number; categories: any[] }[],
) {
  const map: Record<string, { date: string; total: number; categories: any[] }> = {};

  // 1️⃣  copy WakaTime first
  for (const d of wakaDays) map[d.date] = structuredClone(d);

  // 2️⃣  merge Trakt
  for (const d of traktDays) {
    if (!map[d.date]) map[d.date] = { ...d, categories: [...d.categories] };
    else {
      map[d.date].total += d.total;
      for (const cat of d.categories) {
        const existing = map[d.date].categories.find(c => c.name === cat.name);
        existing ? (existing.total += cat.total) : map[d.date].categories.push(cat);
      }
    }
  }

  // 3️⃣  back-fill missing calendar days (shows grey squares)
  const start = parseISO(Object.keys(map).sort()[0]);
  const end   = new Date();                                     // today
  for (const day of eachDayOfInterval({ start, end })) {
    const iso = formatISO(day, { representation: 'date' });
    if (!map[iso]) map[iso] = { date: iso, total: 0, categories: [] };
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}