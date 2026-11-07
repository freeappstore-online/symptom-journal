import { homeSnapshot } from "./recap";
import type { Entry } from "./store";

export function HomeSnapshot({ entries }: { entries: Entry[] }) {
  const { body, general, mood, averageTemperature } = homeSnapshot(entries);
  return (
    <section aria-labelledby="home-snapshot" className="rounded-2xl bg-linear-to-br from-overview-blue to-hero-end px-3 py-2.5 text-on-hero shadow-sm sm:px-4 sm:py-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="home-snapshot" className="text-sm font-extrabold text-on-hero!">At a glance</h2>
        <span className="text-xs text-on-hero/90">Past 7 days</span>
      </div>
      <dl className="grid grid-cols-4 divide-x divide-on-hero/25 text-center">
        <div className="flex min-w-0 flex-col-reverse px-1">
          <dt className="text-[11px] leading-tight text-on-hero/90">Body<span className="sr-only"> symptoms</span></dt>
          <dd className="text-lg font-extrabold leading-tight tabular-nums">{body}</dd>
        </div>
        <div className="flex min-w-0 flex-col-reverse px-1">
          <dt className="text-[11px] leading-tight text-on-hero/90">General<span className="sr-only"> symptoms</span></dt>
          <dd className="text-lg font-extrabold leading-tight tabular-nums">{general}</dd>
        </div>
        <div className="flex min-w-0 flex-col-reverse px-1">
          <dt className="text-[11px] leading-tight text-on-hero/90">Mood<span className="sr-only"> logs</span></dt>
          <dd className="text-lg font-extrabold leading-tight tabular-nums">{mood}</dd>
        </div>
        <div className="flex min-w-0 flex-col-reverse px-1">
          <dt className="text-[11px] leading-tight text-on-hero/90">Avg. temp.</dt>
          <dd className="text-lg font-extrabold leading-tight tabular-nums">
            {averageTemperature === null ? <><span aria-hidden="true">—</span><span className="sr-only">No readings</span></> : <>{averageTemperature.toFixed(1)}<span className="text-xs">°C</span></>}
          </dd>
        </div>
      </dl>
    </section>
  );
}
