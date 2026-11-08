import { entrySymptoms } from "./logging.ts";
import { specificLocationName } from "./subregions.ts";
import type { Entry } from "./store";

const reportTypes = [
  { id: "type:body", label: "Body symptoms" },
  { id: "type:physical", label: "General symptoms" },
  { id: "type:mental", label: "Mood & emotions" },
  { id: "type:temperature", label: "Temperature" },
];

function entryFilters(entry: Entry) {
  const filters: { id: string; label: string; category: string }[] = [];
  const symptoms = entrySymptoms(entry);
  if (entry.temperature) filters.push({ ...reportTypes[3], category: "Entry types" });
  if (symptoms.length) {
    const type = entry.category ?? (entry.location ? "body" : "physical");
    const option = reportTypes.find(item => item.id === `type:${type}`);
    if (option) filters.push({ ...option, category: "Entry types" });
  }
  for (const feeling of entry.feelings ?? []) {
    filters.push({ ...reportTypes[feeling.kind === "mood" ? 2 : 1], category: "Entry types" });
  }
  for (const { name } of [...symptoms, ...(entry.feelings ?? [])]) {
    filters.push({ id: `symptom:${name.trim().toLowerCase()}`, label: name.trim(), category: "Symptoms and mood" });
  }
  if (entry.location) {
    for (const part of [entry.location.region, specificLocationName(entry.location)]) {
      filters.push({ id: `part:${part}`, label: part, category: "Body parts" });
    }
  }
  return filters;
}

export function reportOptions(entries: Entry[]) {
  const filters = entries.flatMap(entryFilters);
  return [
    { id: "", label: "All entries", category: "Entry types" },
    ...reportTypes.map(option => ({ ...option, category: "Entry types" })),
    ...new Map(filters.filter(option => !option.id.startsWith("type:")).map(option => [option.id, option])).values(),
  ];
}

export type ReportRange = "all" | "7" | "30" | "custom";
export type ReportBounds = { start?: Date; end?: Date };
export function reportBounds(range: ReportRange, from: string, through: string, now = new Date()): ReportBounds | null {
  if (range === "all") return {};
  if (range === "custom") {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${through}T23:59:59.999`);
    return +start <= +end ? { start, end } : null;
  }
  const start = new Date(now), end = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - Number(range) + 1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function reportEntries(entries: Entry[], filter: string, bounds: ReportBounds | null) {
  if (!bounds) return [];
  return entries.filter(entry => {
    const time = Date.parse(entry.occurredAt);
    if ((bounds.start && time < +bounds.start) || (bounds.end && time > +bounds.end)) return false;
    return !filter || entryFilters(entry).some(option => option.id === filter);
  });
}
