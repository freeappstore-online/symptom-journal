import { displayLabel, formatLocale, t } from "./language";
import { EntryPhotos } from "./EntryPhotos";
import {
  chartAxisTicks,
  chartTimeUnit,
  chartTimeUnitLabel,
  checkpointMeanSeverity,
  formatChartTime,
  monitoringChangeLog,
  monitoringCheckpoints,
  type MonitoringCheckpoint,
} from "./monitoring";
import type { Entry } from "./store";

export function ReportMonitoringSummary({ entry }: { entry: Entry }) {
  if (!entry.monitoring) return null;
  const checkpoints = monitoringCheckpoints(entry);
  const changes = monitoringChangeLog(entry);
  if (checkpoints.length < 2 && !changes.length) return null;
  return (
    <div className="mt-3 space-y-3 break-inside-avoid">
      {checkpoints.length > 1 && <MonitoringIntensityChart checkpoints={checkpoints} />}
      {!!changes.length && <MonitoringChangeLog changes={changes} />}
    </div>
  );
}

export function MonitoringIntensityChart({
  checkpoints,
}: {
  checkpoints: MonitoringCheckpoint[];
}) {
  const points = checkpoints
    .map((row) => ({
      time: Date.parse(row.occurredAt),
      score: checkpointMeanSeverity(row),
      label: row.kind === "original" ? t("Original entry") : t("Check-in {n}", { n: row.index }),
    }))
    .filter((row): row is { time: number; score: number; label: string } => row.score !== null);
  if (points.length < 2) return null;
  const first = points[0].time;
  const last = points[points.length - 1].time;
  const span = Math.max(last - first, 1);
  const unit = chartTimeUnit(points.map((point) => point.time));
  const ticks = chartAxisTicks(first, last, unit);
  const crossDay = new Date(first).toDateString() !== new Date(last).toDateString();
  const x = (time: number) => 40 + ((time - first) / span) * 250;
  const y = (score: number) => 88 - (score / 10) * 70;
  const path = points
    .map((point, index) => `${index ? "L" : "M"}${x(point.time).toFixed(1)},${y(point.score).toFixed(1)}`)
    .join(" ");
  const locale = formatLocale();
  const scaleLabel = t(chartTimeUnitLabel(unit));
  return (
    <figure className="rounded-xl bg-paper px-3 py-2">
      <figcaption className="text-xs font-semibold">
        {t("Intensity over time")} · 0–10 · {scaleLabel}
      </figcaption>
      <svg
        className="mt-1 w-full max-w-sm"
        viewBox="0 0 318 109"
        role="img"
        aria-label={`${t("Intensity over time")}, ${scaleLabel}`}
      >
        {[0, 5, 10].map((tick) => (
          <g key={tick}>
            <line x1="39" x2="303" y1={y(tick)} y2={y(tick)} className="stroke-line" />
            <text x="34" y={y(tick) + 3} textAnchor="end" className="fill-muted text-[10px]">
              {tick}
            </text>
          </g>
        ))}
        {ticks.slice(1, -1).map((tick) => (
          <line
            key={tick}
            x1={x(tick)}
            x2={x(tick)}
            y1="18"
            y2="88"
            className="stroke-line"
            strokeDasharray="2 3"
          />
        ))}
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" />
        {points.map((point) => (
          <circle
            key={`${point.time}-${point.score}`}
            cx={x(point.time)}
            cy={y(point.score)}
            r="3.5"
            className="fill-accent"
          >
            <title>
              {point.label}: {point.score.toFixed(1)}/10 ·{" "}
              {formatChartTime(point.time, unit, locale, { includeDate: true })}
            </title>
          </circle>
        ))}
        <text x="39" y="103" className="fill-muted text-[10px]">
          {formatChartTime(first, unit, locale, { includeDate: crossDay || unit === "day" || unit === "week" })}
        </text>
        <text x="303" y="103" textAnchor="end" className="fill-muted text-[10px]">
          {formatChartTime(last, unit, locale, { includeDate: crossDay || unit === "day" || unit === "week" })}
        </text>
      </svg>
    </figure>
  );
}

export function MonitoringChangeLog({ changes }: { changes: MonitoringCheckpoint[] }) {
  return (
    <section className="space-y-2" aria-label={t("Notes and photos over time")}>
      <h5 className="text-xs font-semibold text-muted">{t("Notes and photos over time")}</h5>
      <ol className="space-y-2">
        {changes.map((row) => (
          <li key={`${row.kind}-${row.id}`} className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-muted">
              {new Date(row.occurredAt).toLocaleString(formatLocale(), {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {" · "}
              {row.kind === "original" ? t("Original entry") : t("Check-in {n}", { n: row.index })}
            </p>
            {row.notes.trim() && (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                <strong>{t("Notes")}</strong> · {row.notes}
              </p>
            )}
            {!!row.photos.length && (
              <div className="mt-2">
                <p className="text-xs text-muted">
                  {row.photos.length}{" "}
                  {t(row.photos.length === 1 ? "photo added" : "photos added")}
                </p>
                <EntryPhotos photos={row.photos} compact />
              </div>
            )}
            {!row.notes.trim() && !row.photos.length && (
              <p className="mt-1 text-sm text-muted">{displayLabel(row.symptoms.map((s) => s.name).join(" · "))}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
