import { formatLocale, t } from "./language";
import { observations, trendBuckets, type TrendBucket } from "./recap";
import type { ReportBounds } from "./report";
import type { Entry } from "./store";
import { TemperatureHistory } from "./TemperatureHistory";

export function ReportCharts({ entries, bounds }: { entries: Entry[]; bounds: ReportBounds | null }) {
  const rows = observations(entries);
  const hasTemperature = entries.some(entry => entry.temperature);
  if (!rows.length && !hasTemperature) return null;

  const start = bounds?.start?.getTime() ?? rows[0]?.time ?? 0;
  const end = bounds?.end?.getTime() ?? rows.at(-1)?.time ?? start;
  // Cap the number of bars so long reports still fit on a printed page.
  const step = Math.floor((end - start) / (16 * 86_400_000)) + 1;
  const buckets = rows.length ? trendBuckets(rows, start, end, step) : [];

  return (
    <section className="report-charts mt-4 border-b border-line pb-3" aria-label={t("Summary charts")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-base font-bold">{t("Summary charts")}</h3>
        {!!buckets.length && <p className="text-xs text-muted">{step === 1 ? t("Daily") : t("Every {days} days", { days: step })}</p>}
      </div>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
        {!!buckets.length && (
          <>
            <ReportPlot buckets={buckets} title={t("Number of logs")} metric="count" />
            <ReportPlot buckets={buckets} title={t("Average severity / intensity")} metric="mean" />
          </>
        )}
        {hasTemperature && <TemperatureHistory entries={entries} compact />}
      </div>
    </section>
  );
}

function ReportPlot({ buckets, title, metric }: { buckets: TrendBucket[]; title: string; metric: "count" | "mean" }) {
  const isCount = metric === "count";
  const high = isCount ? Math.max(1, ...buckets.map(bucket => bucket.count)) : 10;
  const slot = 264 / buckets.length;
  const firstDay = new Date(buckets[0].start);
  const lastDay = new Date(buckets[buckets.length - 1].end);
  const includeYear = firstDay.getFullYear() !== lastDay.getFullYear();
  const date = (day: Date) => day.toLocaleDateString(formatLocale(), { month: "short", day: "numeric", year: includeYear ? "numeric" : undefined });
  const first = date(firstDay);
  const last = date(lastDay);
  const ticks = isCount && high < 2 ? [0, high] : [0, isCount ? Math.floor(high / 2) : 5, high];
  const y = (value: number) => 86 - value / high * 70;

  return (
    <figure className="min-w-0 break-inside-avoid">
      <figcaption className="text-xs font-semibold">{title}{!isCount && " · 0–10"}</figcaption>
      <svg className="mx-auto w-full max-w-xs" viewBox="0 0 318 109" role="img" aria-label={title}>
        {ticks.map(tick => (
          <g key={tick}>
            <line x1="39" x2="303" y1={y(tick)} y2={y(tick)} className="stroke-line" />
            <text x="34" y={y(tick) + 3} textAnchor="end" className="fill-muted text-[10px]">{tick}</text>
          </g>
        ))}
        {buckets.map((bucket, i) => {
          const value = bucket[metric];
          if (value === null || (isCount && value === 0)) return null;
          const x = 39 + slot * (i + 0.5);
          const width = Math.min(24, slot * 0.72);
          return isCount
            ? <rect key={bucket.start} x={x - width / 2} y={y(value)} width={width} height={86 - y(value)} rx="1" className="fill-accent" />
            : <circle key={bucket.start} cx={x} cy={y(value)} r="3.5" className="fill-accent" />;
        })}
        {first === last
          ? <text x="171" y="103" textAnchor="middle" className="fill-muted text-[10px]">{first}</text>
          : <>
              <text x="39" y="103" className="fill-muted text-[10px]">{first}</text>
              <text x="303" y="103" textAnchor="end" className="fill-muted text-[10px]">{last}</text>
            </>}
      </svg>
    </figure>
  );
}
