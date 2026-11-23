import { entrySymptoms } from "./logging.ts";
import type { EntryPhoto } from "./photo-policy.ts";
import { isReadingCategory, type Entry, type MonitoringUpdate, type SymptomRating } from "./store.ts";

export function canMonitor(entry: Pick<Entry, "category" | "kind">): boolean {
  return entry.kind !== "general" && !isReadingCategory(entry.category);
}

export function isMonitoringActive(entry: Entry): boolean {
  return canMonitor(entry) && entry.monitoring?.status === "active";
}

export function entryActivityTimes(entry: Entry): number[] {
  const times = [Date.parse(entry.occurredAt)];
  for (const update of entry.monitoring?.updates ?? []) {
    times.push(Date.parse(update.occurredAt));
  }
  return times.filter(Number.isFinite);
}

export function entryLatestAt(entry: Entry): number {
  return Math.max(...entryActivityTimes(entry), 0);
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Days this entry should appear on in the diary calendar. */
export function entryDayKeys(entry: Entry): string[] {
  return [...new Set(entryActivityTimes(entry).map((time) => dayKey(new Date(time))))];
}

export function updateSymptoms(
  entry: Pick<Entry, "symptom" | "severity" | "symptoms" | "kind" | "temperature">,
  update: Pick<MonitoringUpdate, "symptoms" | "severity">,
): SymptomRating[] {
  if (update.symptoms?.length) return update.symptoms;
  if (update.severity !== undefined && entry.kind !== "general" && !entry.temperature) {
    const base = entrySymptoms(entry);
    if (base.length === 1) return [{ name: base[0].name, severity: update.severity }];
    if (!base.length && entry.symptom.trim())
      return [{ name: entry.symptom, severity: update.severity }];
  }
  return entrySymptoms(entry);
}

export function latestSymptoms(entry: Entry): SymptomRating[] {
  const updates = entry.monitoring?.updates ?? [];
  if (!updates.length) return entrySymptoms(entry);
  const latest = updates.reduce((a, b) =>
    Date.parse(a.occurredAt) >= Date.parse(b.occurredAt) ? a : b,
  );
  return updateSymptoms(entry, latest);
}

export function monitoringCheckpointCount(entry: Entry): number {
  return 1 + (entry.monitoring?.updates.length ?? 0);
}

export type MonitoringCheckpoint = {
  id: string;
  kind: "original" | "check-in";
  occurredAt: string;
  symptoms: SymptomRating[];
  notes: string;
  photos: EntryPhoto[];
  index: number;
};

/** Original entry plus every check-in, oldest first. */
export function monitoringCheckpoints(entry: Entry): MonitoringCheckpoint[] {
  const rows: MonitoringCheckpoint[] = [
    {
      id: entry.id,
      kind: "original",
      occurredAt: entry.occurredAt,
      symptoms: entrySymptoms(entry),
      notes: entry.notes,
      photos: entry.photos ?? [],
      index: 0,
    },
  ];
  const updates = (entry.monitoring?.updates ?? [])
    .slice()
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
  updates.forEach((update, index) => {
    rows.push({
      id: update.id,
      kind: "check-in",
      occurredAt: update.occurredAt,
      symptoms: updateSymptoms(entry, update),
      notes: update.notes,
      photos: update.photos ?? [],
      index: index + 1,
    });
  });
  return rows;
}

export function checkpointMeanSeverity(checkpoint: MonitoringCheckpoint): number | null {
  if (!checkpoint.symptoms.length) return null;
  return (
    checkpoint.symptoms.reduce((sum, item) => sum + item.severity, 0) /
    checkpoint.symptoms.length
  );
}

/** Timed log of note or photo changes (skips empty check-ins that only change severity). */
export function monitoringChangeLog(entry: Entry): MonitoringCheckpoint[] {
  return monitoringCheckpoints(entry).filter(
    (row) => !!row.notes.trim() || row.photos.length > 0,
  );
}

export type ChartTimeUnit = "minute" | "hour" | "day" | "week";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

function medianGap(times: number[]): number {
  if (times.length < 2) return 0;
  const gaps = [];
  for (let i = 1; i < times.length; i++) gaps.push(times[i]! - times[i - 1]!);
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  return gaps.length % 2 ? gaps[mid]! : (gaps[mid - 1]! + gaps[mid]!) / 2;
}

/** Pick axis grain from overall span and how tightly check-ins cluster. */
export function chartTimeUnit(times: number[]): ChartTimeUnit {
  const sorted = times.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length < 2) return "day";
  const span = sorted[sorted.length - 1]! - sorted[0]!;
  const gap = medianGap(sorted);
  if (span <= 2 * HOUR || gap <= 15 * MINUTE) return "minute";
  if (span <= 2 * DAY || gap <= 3 * HOUR) return "hour";
  if (span <= 60 * DAY) return "day";
  return "week";
}

function floorToUnit(time: number, unit: ChartTimeUnit): number {
  const date = new Date(time);
  if (unit === "minute") {
    date.setSeconds(0, 0);
    return date.getTime();
  }
  if (unit === "hour") {
    date.setMinutes(0, 0, 0);
    return date.getTime();
  }
  if (unit === "day") {
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date.getTime();
}

function stepMs(unit: ChartTimeUnit): number {
  if (unit === "minute") return 15 * MINUTE;
  if (unit === "hour") return HOUR;
  if (unit === "day") return DAY;
  return WEEK;
}

/** Evenly spaced axis ticks for the chosen grain, capped for readable charts. */
export function chartAxisTicks(
  first: number,
  last: number,
  unit: ChartTimeUnit,
  maxTicks = 5,
): number[] {
  if (!Number.isFinite(first) || !Number.isFinite(last) || last < first) return [];
  if (first === last) return [first];
  const step = stepMs(unit);
  let ticks: number[] = [];
  let cursor = floorToUnit(first, unit);
  if (cursor < first) cursor += step;
  while (cursor <= last && ticks.length < 48) {
    ticks.push(cursor);
    cursor += step;
  }
  if (!ticks.length || ticks[0] !== first) ticks = [first, ...ticks];
  if (ticks[ticks.length - 1] !== last) ticks.push(last);
  if (ticks.length <= maxTicks) return ticks;
  const picked = [ticks[0]!];
  const inner = maxTicks - 2;
  for (let i = 1; i <= inner; i++) {
    const index = Math.round((i * (ticks.length - 1)) / (inner + 1));
    const value = ticks[index]!;
    if (value !== picked[picked.length - 1]) picked.push(value);
  }
  if (ticks[ticks.length - 1] !== picked[picked.length - 1]) {
    picked.push(ticks[ticks.length - 1]!);
  }
  return picked;
}

export function formatChartTime(
  time: number,
  unit: ChartTimeUnit,
  locale?: string,
  opts: { includeDate?: boolean } = {},
): string {
  const date = new Date(time);
  if (unit === "minute") {
    return date.toLocaleString(locale, {
      month: opts.includeDate ? "short" : undefined,
      day: opts.includeDate ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (unit === "hour") {
    return date.toLocaleString(locale, {
      month: opts.includeDate ? "short" : undefined,
      day: opts.includeDate ? "numeric" : undefined,
      hour: "numeric",
    });
  }
  if (unit === "week") {
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: opts.includeDate ? "numeric" : undefined,
  });
}

export function chartTimeUnitLabel(unit: ChartTimeUnit): string {
  if (unit === "minute") return "Minute scale";
  if (unit === "hour") return "Hourly scale";
  if (unit === "week") return "Weekly scale";
  return "Daily scale";
}
