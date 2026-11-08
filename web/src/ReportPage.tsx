import { useState } from "react";
import { t, displayLabel, formatLocale } from "./language";
import { locationLabel } from "./anatomy";
import { LocationSketch } from "./BodyMap";
import { EntryPhotos } from "./EntryPhotos";
import { entrySymptoms } from "./logging";
import { LibrarySelect } from "./LibrarySelect";
import { Icon, buttonPrimary, inputClass } from "./ui";
import { reportBounds, reportEntries, reportOptions, type ReportRange } from "./report";
import type { Entry } from "./store";

export function ReportPage({ entries, profileName }: { entries: Entry[]; profileName: string }) {
  const [type, setType] = useState("");
  const [range, setRange] = useState<ReportRange>("all");
  const [from, setFrom] = useState("");
  const [through, setThrough] = useState("");
  const [preview, setPreview] = useState(false);
  const options = reportOptions(entries);
  const bounds = reportBounds(range, from, through);
  const matching = reportEntries(entries, type, bounds);
  const dateLabel = (date: Date) => date.toLocaleDateString(formatLocale(), { dateStyle: "medium" });
  const start = bounds?.start && dateLabel(bounds.start);
  const end = bounds?.end && dateLabel(bounds.end);
  const selection = [
    displayLabel(options.find(option => option.id === type)?.label ?? "All entries"),
    start && end ? start === end ? start : `${start} – ${end}` : t("All time"),
  ].join(" · ");

  function showPreview(value: boolean) {
    setPreview(value);
    window.scrollTo(0, 0);
  }

  if (preview) {
    return <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button type="button" className="min-h-11 font-semibold text-accent underline underline-offset-4" onClick={() => showPreview(false)}>{t("Edit filters")}</button>
        <button type="button" className={buttonPrimary} onClick={() => window.print()}>
          <Icon name="report" /> {t("Print or save PDF")}
        </button>
      </div>
      <ReportDocument entries={matching} profileName={profileName} selection={selection} />
    </>;
  }

  return <section className="space-y-4 rounded-3xl bg-panel p-4 print:hidden sm:p-6">
    <div className="space-y-2">
      <p className="text-sm font-bold">{t("Symptom or entry type")}</p>
      <LibrarySelect label={t("Symptom or entry type")} value={type} options={options} onChange={setType} />
    </div>
    <label className="block space-y-2">
      <span className="block text-sm font-bold">{t("Date range")}</span>
      <select className={inputClass} value={range} onChange={event => setRange(event.target.value as ReportRange)}>
        <option value="all">{t("All time")}</option>
        <option value="7">{t("Past 7 days")}</option>
        <option value="30">{t("Past 30 days")}</option>
        <option value="custom">{t("Custom dates")}</option>
      </select>
    </label>
    {range === "custom" && <div className="grid gap-3 sm:grid-cols-2">
      <label className="min-w-0 space-y-2 text-sm font-bold">
        <span className="block">{t("Start date")}</span>
        <input type="date" className={inputClass} value={from} onChange={event => setFrom(event.target.value)} />
      </label>
      <label className="min-w-0 space-y-2 text-sm font-bold">
        <span className="block">{t("End date")}</span>
        <input type="date" className={inputClass} value={through} onChange={event => setThrough(event.target.value)} />
      </label>
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
      <p className="text-sm text-muted" role="status">
        {!bounds ? t(from && through ? "End date must be on or after the start date." : "Choose a start and end date.") :
          matching.length === 0 ? t("No entries match these filters.") :
          t(matching.length === 1 ? "{count} matching entry" : "{count} matching entries", { count: matching.length })}
      </p>
      <button type="button" className={buttonPrimary} disabled={!matching.length} onClick={() => showPreview(true)}>{t("Preview report")}</button>
    </div>
    {!!matching.length && <p className="text-xs text-muted">{t("Matching entries include their notes and photos.")}</p>}
  </section>;
}

function ReportDocument({ entries, profileName, selection }: { entries: Entry[]; profileName: string; selection: string }) {
  const locale = formatLocale();
  const days = new Map<string, Entry[]>();
  for (const entry of entries) {
    const day = new Date(entry.occurredAt).toDateString();
    const group = days.get(day);
    if (group) group.push(entry);
    else days.set(day, [entry]);
  }
  return (
    <article className="symptom-report mt-4 rounded-2xl bg-panel p-4 sm:p-6 print:m-0 print:p-0">
      <div className="break-inside-avoid border-b-2 border-ink-strong pb-4">
        <h2 className="text-2xl font-bold">{t("Symptom report")}</h2>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="min-w-0 break-words font-semibold">{profileName}</p>
          <p className="text-sm text-muted">{entries.length} {t(entries.length === 1 ? "entry" : "entries")}</p>
        </div>
        <p className="mt-1 break-words text-sm text-muted">{selection}</p>
      </div>
      {[...days].map(([day, logs]) => (
        <section className="mt-5" key={day}>
          <table className="w-full table-fixed">
            <thead className="break-after-avoid">
              <tr>
                <th scope="col" className="border-b border-line pb-1.5 text-left">
                  <h3 className="text-base font-bold">
                    {new Date(logs[0].occurredAt).toLocaleDateString(locale, { dateStyle: "long" })}
                  </h3>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map(entry => (
                <tr key={entry.id}><td><ReportEntry entry={entry} /></td></tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {entries.some(entry => entry.location) && (
        <p className="mt-4 text-xs text-muted">{t("Left and right refer to the patient’s own body.")}</p>
      )}
    </article>
  );
}

function ReportEntry({ entry }: { entry: Entry }) {
  const { location, temperature, duration, notes, feelings, photos } = entry;
  const symptoms = entrySymptoms(entry);
  const heading = location ? locationLabel(location) : temperature ? "Temperature" : entry.category === "mental" ? "Mood" : "General symptoms";
  const showMap = location && location.mode !== "region" && (location.surface3d || location.illustration?.startsWith("adult-"));
  return (
    <div className="py-3">
      <div className="break-inside-avoid">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h4 className="min-w-0 break-words font-bold">{displayLabel(heading)}</h4>
          <time className="shrink-0 text-xs tabular-nums text-muted" dateTime={entry.occurredAt}>
            {new Date(entry.occurredAt).toLocaleTimeString(formatLocale(), { timeStyle: "short" })}
          </time>
        </div>
        {(!!symptoms.length || !!feelings?.length) && (
          <ul className="mt-1 space-y-1 text-sm" aria-label={t("Symptoms and mood")}>
            {symptoms.map((symptom, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="min-w-0 break-words">{displayLabel(symptom.name)}</span>
                <span className="shrink-0 tabular-nums" aria-label={t("Severity {score} out of 10", { score: symptom.severity })}>{symptom.severity}/10</span>
              </li>
            ))}
            {feelings?.map((feeling, i) => (
              <li key={`feeling-${i}`}>
                <div className="flex justify-between gap-3">
                  <span className="min-w-0 break-words">{displayLabel(feeling.name)}{feeling.kind === "mood" && <span className="text-muted"> {t("· Mood")}</span>}</span>
                  <span className="shrink-0 tabular-nums" aria-label={t("Intensity {score} out of 10", { score: feeling.intensity })}>{feeling.intensity}/10</span>
                </div>
                {feeling.notes && <p className="whitespace-pre-wrap break-words text-muted">{feeling.notes}</p>}
              </li>
            ))}
          </ul>
        )}
        {temperature && (
          <p className="mt-1 text-sm"><strong>{temperature.celsius.toFixed(1)} °C</strong>{temperature.method && ` · ${displayLabel(temperature.method)}`}</p>
        )}
        {duration && <p className="mt-1 break-words text-xs text-muted">{t("Duration")} · {duration}</p>}
      </div>
      {notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm"><strong>{t("Notes")}</strong> · {notes}</p>}
      {(showMap || !!photos?.length) && (
        <div className="mt-2 flex flex-wrap items-start gap-3">
          {showMap && (
            <figure className="w-40 max-w-full break-inside-avoid">
              <LocationSketch value={location} readOnly showLabel={false} compact />
            </figure>
          )}
          <EntryPhotos photos={photos} compact />
        </div>
      )}
    </div>
  );
}
