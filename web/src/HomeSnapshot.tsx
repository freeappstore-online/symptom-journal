import { displayLabel, formatLocale, t } from "./language";
import { entrySymptoms, entryTitle } from "./logging";
import { recentWindow, observations } from "./recap";
import type { Entry } from "./store";

export function HomeSnapshot({ entries, onOpen, onHistory }: {
  entries: Entry[];
  onOpen: (entry: Entry) => void;
  onHistory: () => void;
}) {
  const now = new Date();
  const { start } = recentWindow(7, now);
  const recent = entries.filter(entry => +new Date(entry.occurredAt) >= start && +new Date(entry.occurredAt) <= +now);
  const symptoms = observations(recent).filter(observation => !observation.mood);
  const average = symptoms.length
    ? (symptoms.reduce((sum, observation) => sum + observation.score, 0) / symptoms.length)
      .toLocaleString(formatLocale(), { maximumFractionDigits: 1 })
    : null;
  const symptomNames = recent.flatMap(entry => entry.category === "mental" ? [] : [
    ...entrySymptoms(entry).map(symptom => symptom.name),
    ...(entry.feelings ?? []).filter(feeling => feeling.kind === "physical").map(feeling => feeling.name),
  ]);
  const latestSymptoms = [...new Set(symptomNames)].slice(0, 2);
  const days = new Set(symptoms.map(observation => new Date(observation.time).toDateString())).size;

  return (
    <section aria-labelledby="home-snapshot" className="rounded-2xl bg-panel px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 id="home-snapshot" className="text-sm font-extrabold">{t("Past 7 days")}</h2>
        <button type="button" onClick={onHistory} className="min-h-11 shrink-0 text-xs font-semibold text-accent underline">{t("View history")}</button>
      </div>
      <dl className="grid grid-cols-3 divide-x divide-line rounded-xl bg-sky-soft p-2 text-center">
        <div><dt className="text-xs text-muted">{t("Entries")}</dt><dd className="font-bold tabular-nums">{recent.length}</dd></div>
        <div className="px-1"><dt className="text-xs text-muted">{t("Avg. severity")}</dt><dd className="font-bold tabular-nums">{average === null ? "—" : `${average}/10`}</dd></div>
        <div className="px-1"><dt className="text-xs text-muted">{t("Symptom days")}</dt><dd className="font-bold tabular-nums">{days}/7</dd></div>
      </dl>
      {latestSymptoms.length > 0 && <p className="mt-2 truncate text-xs [@media(max-height:620px)]:hidden"><strong>{t("Latest symptoms")}</strong> · {latestSymptoms.map(displayLabel).join(", ")}</p>}
      {recent[0] && (
        <button type="button" onClick={() => onOpen(recent[0])} className="flex min-h-11 w-full items-center gap-2 text-left text-xs text-accent [@media(max-height:620px)]:hidden">
          <span className="shrink-0 font-bold">{t("Latest entry")}</span>
          <span className="truncate underline">{displayLabel(entryTitle(recent[0]))}</span>
        </button>
      )}
    </section>
  );
}
