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
  const selection = [
    displayLabel(options.find(option => option.id === type)?.label ?? "All entries"),
    bounds?.start && bounds.end
      ? `${dateLabel(bounds.start)} – ${dateLabel(bounds.end)}`
      : t("All time"),
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
  return (
    <article className="symptom-report mt-4 space-y-5 rounded-[1.75rem] bg-panel p-5 print:mt-0 print:p-0">
      <div className="break-inside-avoid space-y-1">
        <h2 className="text-2xl font-bold">{t("Symptom report")}</h2>
        <p className="break-words font-semibold">{profileName}</p>
        <p className="text-sm text-muted">
          {entries.length} {entries.length === 1 ? t("entry") : t("entries")}
        </p>
        <p className="break-words text-sm text-muted">{selection}</p>
        {entries.some(e=>e.location) && <p className="text-sm text-muted">{t("Left and right refer to the patient’s own body.")}</p>}
      </div>
      {entries.map(e => {
        const symptoms = entrySymptoms(e);
        const heading = e.location ? locationLabel(e.location) : e.temperature ? "Temperature" : e.category === "mental" ? "Mood" : "General symptoms";
        return <section key={e.id} className="space-y-3 border-t border-line pt-4">
          <div className="break-inside-avoid space-y-2">
            <time className="block text-sm text-muted" dateTime={e.occurredAt}>{new Date(e.occurredAt).toLocaleString(formatLocale(), { dateStyle: "medium", timeStyle: "short" })}</time>
            <h3 className="text-lg font-bold">{displayLabel(heading)}</h3>
            {!!symptoms.length && <ul className="divide-y divide-line text-sm" aria-label={t("Symptom severity")}>
              {symptoms.map((symptom,i) => <li key={i} className="flex justify-between gap-3 py-1.5">
                <span className="min-w-0 break-words">{displayLabel(symptom.name)}</span>
                <span className="shrink-0 tabular-nums" aria-label={t("Severity {score} out of 10", {score:symptom.severity})}>{symptom.severity}/10</span>
              </li>)}
            </ul>}
            {e.temperature && <p className="text-sm"><strong>{e.temperature.celsius.toFixed(1)} °C</strong>{e.temperature.method && ` · ${displayLabel(e.temperature.method)}`}</p>}
            {e.duration && <p className="text-sm">{t("Duration")} {e.duration}</p>}
          </div>
          {!!e.feelings?.length && <ul className="divide-y divide-line text-sm" aria-label={t("Other symptoms and mood")}>
            {e.feelings.map((feeling,i) => <li key={i} className="break-inside-avoid py-1.5">
              <div className="flex justify-between gap-3">
                <span className="min-w-0 break-words">{displayLabel(feeling.name)}{feeling.kind === "mood" && <span className="text-muted"> {t("· Mood")}</span>}</span>
                <span className="shrink-0 tabular-nums" aria-label={t("Intensity {score} out of 10", {score:feeling.intensity})}>{feeling.intensity}/10</span>
              </div>
              {feeling.notes && <p className="mt-1 whitespace-pre-wrap break-words">{feeling.notes}</p>}
            </li>)}
          </ul>}
          {e.notes && <p className="whitespace-pre-wrap break-words text-sm"><strong className="block">{t("Notes")}</strong>{e.notes}</p>}
          {e.location && (e.location.surface3d || (e.location.illustration && e.location.illustration !== "none")) && (
            <div className="max-w-sm break-inside-avoid">
              <LocationSketch value={e.location} readOnly showLabel={false}/>
            </div>
          )}
          <EntryPhotos photos={e.photos} />
        </section>;
      })}
    </article>
  );
}
