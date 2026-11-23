import { entrySymptoms } from "./logging.ts";
import { locationLabel } from "./anatomy.ts";
import { updateSymptoms } from "./monitoring.ts";
import { isReadingCategory, type Entry, type SymptomRating } from "./store.ts";
export type Observation = {
  id: string;
  entryId: string;
  key: string;
  label: string;
  time: number;
  endTime?: number;
  score: number;
  mood: boolean;
};
function symptomLabel(entry: Entry, name: string) {
  return (
    name.trim() +
    (entry.location
      ? ` · ${locationLabel(entry.location)}`
      : " · " + (entry.category === "mental" ? "Mental health" : "General"))
  );
}
function pushSymptomRows(
  rows: Observation[],
  entry: Entry,
  items: SymptomRating[],
  time: number,
  idSuffix: string,
  endTime?: number,
) {
  items.forEach((item, i) => {
    const label = symptomLabel(entry, item.name);
    rows.push({
      id: entry.id + ":symptom" + (i ? ":" + i : "") + idSuffix,
      entryId: entry.id,
      key: "symptom:" + label.toLowerCase(),
      label,
      time,
      ...(endTime !== undefined ? { endTime } : {}),
      score: item.severity,
      mood: entry.category === "mental",
    });
  });
}
export function observations(entries: Entry[]): Observation[] {
  return entries
    .flatMap((e) => {
      const rows: Observation[] = [];
      const time = Date.parse(e.occurredAt);
      if (!Number.isFinite(time)) return rows;
      if (e.kind !== "general" && !isReadingCategory(e.category)) {
        pushSymptomRows(
          rows,
          e,
          entrySymptoms(e),
          time,
          "",
          durationEnd(time, e.duration) ?? undefined,
        );
        for (const update of e.monitoring?.updates ?? []) {
          const updateTime = Date.parse(update.occurredAt);
          if (!Number.isFinite(updateTime)) continue;
          pushSymptomRows(
            rows,
            e,
            updateSymptoms(e, update),
            updateTime,
            ":update:" + update.id,
          );
        }
      }
      (e.feelings ?? []).forEach((f, i) =>
        rows.push({
          id: e.id + ":feeling:" + i,
          entryId: e.id,
          key: f.kind + ":" + f.name.trim().toLowerCase(),
          label: f.name.trim() + (f.kind === "mood" ? " · Mood" : ""),
          time,
          score: f.intensity,
          mood: f.kind === "mood",
        }),
      );
      return rows;
    })
    .sort((a, b) => a.time - b.time);
}
export function recentWindow(days: number, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

export function homeSnapshot(entries: Entry[], now = new Date()) {
  const { start } = recentWindow(7, now);
  let body = 0;
  let general = 0;
  let mood = 0;
  let temperatureSum = 0;
  let temperatureCount = 0;
  const end = now.getTime();

  const countSymptoms = (entry: Entry, items: SymptomRating[]) => {
    const symptomCount = items.length;
    if (entry.category === "mental") mood += symptomCount;
    else if (entry.category === "body" || entry.location) body += symptomCount;
    else general += symptomCount;
  };

  for (const entry of entries) {
    const time = Date.parse(entry.occurredAt);
    if (Number.isFinite(time) && time >= start && time <= end) {
      if (entry.temperature) {
        temperatureSum += entry.temperature.celsius;
        temperatureCount++;
      }
      countSymptoms(entry, entrySymptoms(entry));
      for (const feeling of entry.feelings ?? []) {
        if (feeling.kind === "mood") mood++;
        else general++;
      }
    }
    for (const update of entry.monitoring?.updates ?? []) {
      const updateTime = Date.parse(update.occurredAt);
      if (!Number.isFinite(updateTime) || updateTime < start || updateTime > end)
        continue;
      countSymptoms(entry, updateSymptoms(entry, update));
    }
  }

  return {
    body,
    general,
    mood,
    averageTemperature: temperatureCount ? temperatureSum / temperatureCount : null,
  };
}

export type TrendBucket = { start: number; end: number; count: number; mean: number | null; latestId: string | null };
export function trendBuckets(rows: Observation[], start: number, end: number, step: number): TrendBucket[] {
  const result: TrendBucket[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= end) {
    const next = new Date(cursor);
    next.setDate(next.getDate() + step);
    const finish = Math.min(end, next.getTime() - 1);
    const items = rows.filter(r => r.time >= Math.max(start, cursor.getTime()) && r.time <= finish);
    result.push({ start: cursor.getTime(), end: finish, count: items.length,
      mean: items.length ? items.reduce((n,r) => n+r.score,0)/items.length : null,
      latestId: items.length ? items.reduce((a,b) => a.time > b.time ? a : b).id : null });
    cursor.setTime(next.getTime());
  }
  return result;
}
export function recordedTogether(all: Observation[], selected: Observation[]) {
  const ids = new Set(selected.map(r => r.entryId));
  const own = new Set(selected.map(r => r.key));
  const groups = new Map<string, { label: string; ids: Set<string> }>();
  for (const row of all) {
    if (!ids.has(row.entryId) || own.has(row.key)) continue;
    const group = groups.get(row.key) ?? { label: row.label, ids: new Set<string>() };
    group.ids.add(row.entryId); groups.set(row.key, group);
  }
  return [...groups.values()].map(g => ({ label: g.label, count: g.ids.size, total: ids.size }))
    .sort((a,b) => b.count-a.count || a.label.localeCompare(b.label));
}

export function durationEnd(start:number,text:string):number|null {
  const match=text.trim().match(/^(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|days?)$/i);
  if(!match)return null;
  const amount=Number(match[1]),unit=match[2].toLowerCase();
  const ms=amount*(unit.startsWith("d")?86400000:unit.startsWith("h")?3600000:60000);
  return ms>0 && ms<=7*86400000 ? start+ms : null;
}
