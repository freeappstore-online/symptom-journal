import { formatLocale, t } from "./language";
import { homeSnapshot } from "./recap";
import type { Entry } from "./store";

export function HomeSnapshot({ entries }: { entries: Entry[] }) {
  const { body, general, mood, averageTemperature } = homeSnapshot(entries);
  const readings = [
    ["Symptoms by location", body],
    ["General symptoms", general],
    ["Mood logs", mood],
    ["Avg. temperature", averageTemperature === null ? t("No readings") :
      `${averageTemperature.toLocaleString(formatLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`],
  ] as const;

  return (
    <section aria-labelledby="home-snapshot" className="rounded-2xl bg-linear-to-br from-overview-blue to-hero-end px-3 py-2.5 text-on-hero shadow-sm sm:px-4 sm:py-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="home-snapshot" className="text-sm font-extrabold text-on-hero!">{t("At a glance")}</h2>
        <span className="text-xs text-on-hero/90">{t("Past 7 days")}</span>
      </div>
      <dl className="grid grid-cols-4 divide-x divide-on-hero/25 text-center">
        {readings.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col-reverse justify-end gap-0.5 px-1">
            <dt className="text-[11px] leading-tight text-on-hero/90">{t(label)}</dt>
            <dd className={`font-extrabold leading-tight tabular-nums ${label === "Avg. temperature" && averageTemperature === null ? "min-h-5 text-xs" : "text-base sm:text-lg"}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
