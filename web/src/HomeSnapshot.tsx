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
    <section aria-labelledby="home-snapshot" className="rounded-2xl bg-panel p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 id="home-snapshot" className="text-base font-extrabold">{t("At a glance")}</h2>
        <span className="text-xs text-muted">{t("Past 7 days")}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 divide-x divide-line rounded-xl bg-sky-soft p-3">
        <div><dt className="text-xs text-muted">{t("Entries")}</dt><dd className="text-xl font-bold tabular-nums">{recent.length}</dd></div>
        <div className="pl-3"><dt className="text-xs text-muted">{t("Avg. symptom severity")}</dt><dd className="text-xl font-bold tabular-nums">{average === null ? "—" : `${average}/10`}</dd></div>
      </dl>
      {days > 0 && <p className="mt-2 text-sm text-muted">{t("Days with symptoms logged: {days} of 7", { days })}</p>}
      {latestSymptoms.length > 0 && <p className="mt-2 break-words text-sm"><strong>{t("Latest symptoms")}</strong> · {latestSymptoms.map(displayLabel).join(", ")}</p>}
      <div className="mt-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">{t("Recent entries")}</h3>
        <button type="button" onClick={onHistory} className="min-h-11 text-xs font-semibold text-accent underline">{t("View history")}</button>
      </div>
      {recent.length ? (
        <ul className="divide-y divide-line">
          {recent.slice(0, 3).map(entry => (
            <li key={entry.id}>
              <button type="button" onClick={() => onOpen(entry)} className="flex min-h-11 w-full flex-wrap items-center justify-between gap-x-3 py-2 text-left text-sm">
                <span className="break-words font-semibold">{displayLabel(entryTitle(entry))}</span>
                <time className="text-xs text-muted" dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleDateString(formatLocale(), { month: "short", day: "numeric" })}</time>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">{t("No entries in the past 7 days.")}</p>}
    </section>
  );
}
