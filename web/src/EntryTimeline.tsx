import { useState } from "react";
import { Bed, ChevronLeft, ChevronRight, Sunrise } from "lucide-react";
import { formatLocale, t } from "./language";
import { inputClass } from "./ui";

export function dateOffset(day: string, offset: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const shifted = new Date(year, month - 1, date + offset, 12);
  return [shifted.getFullYear(), shifted.getMonth() + 1, shifted.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0")).join("-");
}

export function PeriodDays({ selected, logged, onSelect }: {
  selected: string;
  logged: ReadonlySet<string>;
  onSelect: (day: string) => void;
}) {
  const [center, setCenter] = useState(selected);
  const dates = Array.from({ length: 7 }, (_, index) => dateOffset(center, index - 3));
  const jumpTo = (day: string) => {
    setCenter(day);
    onSelect(day);
  };
  return (
    <fieldset className="space-y-2 rounded-2xl bg-panel p-3">
      <legend className="px-1 text-sm font-semibold">{t("Period date")}</legend>
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="grid size-11 place-items-center text-accent" aria-label={t("Previous week")} onClick={() => jumpTo(dateOffset(center, -7))}><ChevronLeft aria-hidden="true" size={19} /></button>
        <input className={`${inputClass} max-w-44`} type="date" required aria-label={t("Period date")} value={selected} onChange={event => {
          if (event.target.value) jumpTo(event.target.value);
        }} />
        <button type="button" className="grid size-11 place-items-center text-accent" aria-label={t("Next week")} onClick={() => jumpTo(dateOffset(center, 7))}><ChevronRight aria-hidden="true" size={19} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dates.map(day => {
          const display = new Date(day + "T12:00");
          const isLogged = logged.has(day);
          return (
            <button key={day} type="button" aria-pressed={day === selected}
              aria-label={display.toLocaleDateString(formatLocale(), { dateStyle: "full" }) + (isLogged ? ` · ${t("Period logged")}` : "")}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center rounded-lg text-xs ${day === selected ? "bg-accent text-paper" : isLogged ? "bg-pain-soft text-ink" : "bg-paper-deep text-ink"}`}
              onClick={() => onSelect(day)}>
              <span className="max-w-full truncate">{display.toLocaleDateString(formatLocale(), { weekday: "short" })}</span>
              <strong className="text-sm">{display.getDate()}</strong>
              <span className={`mt-0.5 size-1.5 rounded-full ${isLogged ? day === selected ? "bg-paper" : "bg-pain" : "invisible"}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SleepTimeline({ bed, wake }: { bed: string; wake: string }) {
  const minutes = Math.round((Date.parse(wake) - Date.parse(bed)) / 60_000);
  const ready = minutes > 0;
  const hours = ready ? Math.floor(minutes / 60) : 0;
  const remaining = ready ? minutes % 60 : 0;
  const crossesMidnight = ready && bed.slice(0, 10) !== wake.slice(0, 10);
  return (
    <div className="rounded-2xl bg-violet-soft p-4 text-ink">
      <p className="text-xs font-semibold">{t("Time in bed")}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums" aria-live="polite">
        {ready ? t("{hours} h {minutes} min", { hours, minutes: remaining }) : "—"}
      </p>
      <div className="mt-3 flex items-center gap-2 text-violet" aria-hidden="true">
        <Bed className="size-5 shrink-0" />
        <div className="relative h-1.5 flex-1 rounded-full bg-panel">
          {ready && <div className="h-full rounded-full bg-violet" />}
          {crossesMidnight && <div className="absolute inset-y-0 w-0.5 bg-panel" style={{
            // Keep the midnight marker proportional to the selected interval.
            left: `${Math.max(0, Math.min(100, 100 * (Date.parse(dateOffset(bed.slice(0, 10), 1) + "T00:00") - Date.parse(bed)) / (Date.parse(wake) - Date.parse(bed))))}%`,
          }} />}
        </div>
        <Sunrise className="size-5 shrink-0" />
      </div>
      {crossesMidnight && <p className="mt-2 text-xs">{t("Crosses midnight")}</p>}
    </div>
  );
}
