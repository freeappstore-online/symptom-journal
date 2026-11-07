import { homeSnapshot } from "./recap";
import type { Entry } from "./store";

export function HomeSnapshot({ entries }: { entries: Entry[] }) {
  const { body, general, mood, averageTemperature } = homeSnapshot(entries);
  return (
    <section aria-labelledby="home-snapshot" className="rounded-2xl bg-panel px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="home-snapshot" className="text-sm font-extrabold">At a glance</h2>
        <span className="text-xs text-muted">Past 7 days</span>
      </div>
      <dl className="grid grid-cols-4 divide-x divide-line text-center">
        <div className="flex min-w-0 flex-col-reverse px-1">
          <dt className="text-[11px] leading-tight text-muted">Body<span className="sr-only"> symptoms</span></dt>
          <dd className="text-lg font-extrabold leading-tight text-accent tabular-nums">{body}</dd>
        </div>
        <div className="flex min-w-0 flex-col-reverse px-1">
          <dt className="text-[11px] leading-tight text-muted">General<span className="sr-only"> symptoms</span></dt>
          <dd className="text-lg font-extrabold leading-tight text-sky tabular-nums">{general}</dd>
        </div>
        <div className="flex min-w-0 flex-col-reverse px-1">
          <dt className="text-[11px] leading-tight text-muted">Mood<span className="sr-only"> logs</span></dt>
          <dd className="text-lg font-extrabold leading-tight text-violet tabular-nums">{mood}</dd>
        </div>
        <div className="flex min-w-0 flex-col-reverse px-1">
          <dt className="text-[11px] leading-tight text-muted">Avg. temp.</dt>
          <dd className="text-lg font-extrabold leading-tight text-pain tabular-nums">
            {averageTemperature === null ? <><span aria-hidden="true">—</span><span className="sr-only">No readings</span></> : <>{averageTemperature.toFixed(1)}<span className="text-xs">°C</span></>}
          </dd>
        </div>
      </dl>
    </section>
  );
}
