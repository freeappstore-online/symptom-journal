import { displayLabel, formatLocale, t } from "./language";
import { entryTitle } from "./logging";
import { entryActivityTimes, latestSymptoms } from "./monitoring";
import { recentWindow, observations } from "./recap";
import type { Entry } from "./store";

export function HomeSnapshot({ entries, onOpen, onHistory }: {
  entries: Entry[];
  onOpen: (entry: Entry) => void;
  onHistory: () => void;
}) {
  const now = new Date();
  const { start } = recentWindow(7, now);
  const end = +now;
  const recent = entries.filter(entry =>
    entryActivityTimes(entry).some(time => time >= start && time <= end),
  );
  const symptoms = observations(recent).filter(observation =>
    !observation.mood && observation.time >= start && observation.time <= end,
  );
  const average = symptoms.length
    ? (symptoms.reduce((sum, observation) => sum + observation.score, 0) / symptoms.length)
      .toLocaleString(formatLocale(), { maximumFractionDigits: 1 })
    : null;
  const symptomNames = recent.flatMap(entry => {
    const inWindow = entryActivityTimes(entry).some(time => time >= start && time <= end);
    if (!inWindow || entry.category === "mental") return [];
    return [
      ...latestSymptoms(entry).map(symptom => symptom.name),
      ...(entry.feelings ?? []).filter(feeling => feeling.kind === "physical").map(feeling => feeling.name),
    ];
  });
  const latestSymptomsList = [...new Set(symptomNames)].slice(0, 2);
  const days = new Set(symptoms.map(observation => new Date(observation.time).toDateString())).size;
  const latest = recent
    .slice()
    .sort((a, b) => Math.max(...entryActivityTimes(b)) - Math.max(...entryActivityTimes(a)))[0];

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
      {latestSymptomsList.length > 0 && <p className="mt-2 truncate text-xs [@media(max-height:620px)]:hidden"><strong>{t("Latest symptoms")}</strong> · {latestSymptomsList.map(displayLabel).join(", ")}</p>}
      {latest && (
        <button type="button" onClick={() => onOpen(latest)} className="flex min-h-11 w-full items-center gap-2 text-left text-xs text-accent [@media(max-height:620px)]:hidden">
          <span className="shrink-0 font-bold">{t("Latest entry")}</span>
          <span className="truncate underline">{displayLabel(entryTitle(latest))}</span>
        </button>
      )}
    </section>
  );
}
