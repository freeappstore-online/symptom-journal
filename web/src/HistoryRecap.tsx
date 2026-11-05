import { DailyOverview } from "./DailyOverview";
import { LibrarySelect } from "./LibrarySelect";
import { useId, useState } from "react";
import type { Entry } from "./store";
import { observations, recentWindow, trendBuckets, recordedTogether, type TrendBucket, type Observation } from "./recap";
import { inputClass } from "./ui";
const date = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const stamp = (t: number) =>
  new Date(t).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
export function HistoryRecap({
  entries,
  onOpen,
}: {
  entries: Entry[];
  onOpen: (id: string) => void;
}) {
  const [days, setDays] = useState(7);
  const [range, setRange] = useState(30);
  const [metric, setMetric] = useState<"severity" | "frequency">("severity");
  const [groupDays, setGroupDays] = useState(1);
  const [chosen, setChosen] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const all = observations(entries);
  const series = [...new Map(all.map((o) => [o.key, o.label])).entries()].sort(
    (a, b) => a[1].localeCompare(b[1]),
  );
  const key = series.some(([k]) => k === chosen) ? chosen : series[0]?.[0];
  const window = recentWindow(days);
  const recent = all.filter(
    (o) => (o.endTime ?? o.time) >= window.start && o.time <= window.end,
  );
  const single = all.filter((o) => o.key === key);
  const trendWindow = range === 0
    ? { start: Math.min(single[0]?.time ?? window.start, window.end), end: window.end }
    : recentWindow(range);
  const filtered = single.filter(o => o.time >= trendWindow.start && o.time <= trendWindow.end);
  const buckets = trendBuckets(filtered, trendWindow.start, trendWindow.end, groupDays);
  const together = recordedTogether(all, filtered).slice(0, 3);
  const mean = filtered.length ? filtered.reduce((n,r) => n+r.score,0)/filtered.length : null;
  const peak = filtered.length ? Math.max(...filtered.map(r => r.score)) : null;
  const selectedRow = all.find((o) => o.id === selected);
  if (!all.length) return null;
  return (
    <section className="space-y-5" aria-label="History recap">
      <DailyOverview rows={all} onOpen={onOpen}/>
      <div className="overflow-hidden rounded-3xl bg-panel shadow-sm">
        <div className="bg-hero-start px-5 py-5 text-on-hero sm:px-6">
          <label className="block text-xs font-semibold uppercase tracking-widest" htmlFor="trend-symptom">Symptom history</label>
          <LibrarySelect label="Symptom or mood" value={key??""} options={series.map(([id,label])=>({id,label}))} onChange={id=>{setChosen(id);setSelected(null);}}/>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <label className="flex items-center justify-between gap-3 text-sm font-bold">Measure<select aria-label="Chart measure" className="min-h-11 rounded-xl bg-paper-deep px-4" value={metric} onChange={e=>{setMetric(e.target.value as "severity"|"frequency");setSelected(null);}}><option value="severity">Severity / intensity</option><option value="frequency">Frequency</option></select></label>
          <TrendChart buckets={buckets} metric={metric} onSelect={setSelected} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select aria-label="History period" className="min-h-11 rounded-xl bg-paper-deep px-4 text-sm font-bold" value={range} onChange={e=>{setRange(Number(e.target.value));setSelected(null);}}><option value={14}>Past 2 weeks</option><option value={30}>Past month</option><option value={90}>Past 3 months</option><option value={0}>All time</option></select>
            <select aria-label="Group chart by" className="min-h-11 rounded-full bg-paper-deep px-3 text-sm font-semibold" value={groupDays} onChange={e => { setGroupDays(Number(e.target.value)); setSelected(null); }}>
              <option value={1}>Daily</option><option value={7}>Weekly</option>
            </select>
          </div>

          <dl className="grid grid-cols-3 gap-3 border-t border-line pt-5">
            {[ ["Logs", String(filtered.length)], [single[0]?.mood ? "Avg. intensity" : "Avg. severity", mean === null ? "—" : `${mean.toFixed(1)}/10`], ["Highest", peak === null ? "—" : `${peak}/10`] ].map(([label,value]) =>
              <div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-xl font-bold text-ink-strong">{value}</dd></div>)}
          </dl>
          <div className="border-t border-line pt-5">
            <h3 className="text-base">Recorded together</h3>
            {together.length ? <ul className="mt-3 space-y-4">{together.map(item => <li key={item.label}>
              <div className="flex items-start justify-between gap-3 text-sm"><span>{item.label}</span><span className="shrink-0 font-semibold">{item.count} of {item.total} logs</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
                {/* Dynamic width reflects the share of selected entries containing this observation. */}
                <div className="h-full rounded-full bg-accent" style={{width: `${item.count/item.total*100}%`}} />
              </div>
            </li>)}</ul> : <p className="mt-2 text-sm text-muted">None recorded together.</p>}
          </div>
        </div>
      </div>
      <div className="rounded-3xl bg-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Recent days</h2>
          <label className="text-sm">
            <span className="sr-only">Recent period</span>
            <select
              className={inputClass}
              value={days}
              onChange={(e) => {
                setDays(Number(e.target.value));
                setSelected(null);
              }}
            >
              <option value={1}>Today</option>
              <option value={3}>Past 3 days</option>
              <option value={7}>Past 7 days</option>
              <option value={14}>Past 14 days</option>
            </select>
          </label>
        </div>

        {recent.length ? (
          <Plot
            rows={recent}
            start={window.start}
            end={window.end}
            onSelect={setSelected}
          />
        ) : (
          <p className="py-8 text-sm text-muted">No logs in this period.</p>
        )}
        <p className="text-xs text-muted">
          Dots: logs · Bands: duration
        </p>
      </div>
      {selectedRow && (
        <div className="rounded-3xl bg-accent-soft p-4" role="status">
          <p className="font-bold">{selectedRow.label}</p>
          <p className="mt-1 text-sm">
            {stamp(selectedRow.time)} · {selectedRow.score}/10{" "}
            {selectedRow.mood ? "intensity" : "severity"}
          </p>
          <button
            type="button"
            className="mt-2 min-h-11 text-sm font-bold underline"
            onClick={() => onOpen(selectedRow.entryId)}
          >
            View entry →
          </button>
        </div>
      )}
      <details className="rounded-3xl bg-panel p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Recent logs
        </summary>
        <ul className="mt-3 space-y-2">
          {recent.map((o) => (
            <li key={o.id}>
              <button
                className="min-h-11 w-full rounded-xl bg-sky-soft p-3 text-left text-sm"
                onClick={() => onOpen(o.entryId)}
              >
                {o.label} · {o.score}/10
                <span className="block text-xs text-muted">
                  {stamp(o.time)}
                </span>
              </button>
            </li>
          ))}
          {!recent.length && (
            <li className="text-sm text-muted">No logs in this period.</li>
          )}
        </ul>
      </details>
    </section>
  );
}
function TrendChart({ buckets, metric, onSelect }: { buckets: TrendBucket[]; metric: "severity" | "frequency"; onSelect: (id: string) => void }) {
  const gradient = useId().replaceAll(":", "");
  const max = metric === "severity" ? 10 : Math.max(1, ...buckets.map(b => b.count));
  const x = (i: number) => buckets.length === 1 ? 210 : 42 + i/(buckets.length-1)*336;
  const value = (b: TrendBucket) => metric === "severity" ? b.mean : b.count;
  const y = (n: number) => 205 - n/max*170;
  const segments: {i:number; n:number}[][] = [];
  buckets.forEach((b,i) => {
    const n = value(b);
    if (n === null) { if (segments.at(-1)?.length) segments.push([]); return; }
    if (!segments.length) segments.push([]);
    segments.at(-1)!.push({i,n});
  });
  const ticks = metric === "severity" ? [0,5,10] : [...new Set([0,Math.ceil(max/2),max])];
  const hasLogs = buckets.some(b => b.count > 0);
  return <div>
    <svg viewBox="0 0 408 245" className="w-full" role="group" aria-label={metric === "severity" ? "Average recorded severity or intensity over time" : "Number of recorded logs over time"}>
      <defs><linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity="0.2"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
      {ticks.map(n => <g key={n}><line x1="42" x2="378" y1={y(n)} y2={y(n)} className="stroke-line" strokeDasharray="3 5"/><text x="30" y={y(n)+4} textAnchor="end" className="fill-muted text-[11px]">{n}</text></g>)}
      {hasLogs && segments.filter(s => s.length > 1).map((s,i) => {
        const line = s.map((p,j) => `${j ? "L" : "M"}${x(p.i)},${y(p.n)}`).join(" ");
        return <g key={i} className="text-accent"><path d={`${line} L${x(s.at(-1)!.i)},205 L${x(s[0].i)},205 Z`} fill={`url(#${gradient})`} /><path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/></g>;
      })}
      {hasLogs && buckets.map((b,i) => {
        const n = value(b); if(n === null || !b.latestId) return null;
        return <g key={b.start} role="button" tabIndex={0} className="cursor-pointer text-accent"
          aria-label={`${date(b.start)} to ${date(b.end)}: ${metric === "severity" ? `${n.toFixed(1)} out of 10 average, ` : ""}${b.count} logs. Open latest log.`}
          onClick={() => onSelect(b.latestId!)} onKeyDown={e => { if(e.key === "Enter" || e.key === " ") {e.preventDefault(); onSelect(b.latestId!);} }}>
          <title>{date(b.start)} · {metric === "severity" ? `${n.toFixed(1)}/10 average · ` : ""}{b.count} logs</title>
          <circle cx={x(i)} cy={y(n)} r="14" fill="transparent"/>
          <circle cx={x(i)} cy={y(n)} r="4.5" className="fill-panel" stroke="currentColor" strokeWidth="2"/>
        </g>;
      })}
      {!hasLogs && <text x="210" y="120" textAnchor="middle" className="fill-muted text-[12px]">No logs in this period</text>}
      <text x="42" y="230" className="fill-muted text-[11px]">{buckets[0] ? date(buckets[0].start) : ""}</text>
      <text x="378" y="230" textAnchor="end" className="fill-muted text-[11px]">{buckets.at(-1) ? date(buckets.at(-1)!.end) : ""}</text>
    </svg>
  </div>;
}

function Plot({rows,start,end,onSelect}:{rows:Observation[];start:number;end:number;onSelect:(id:string)=>void}) {
  const [hidden,setHidden]=useState<string[]>([]);
  const keys=[...new Map(rows.map(o=>[o.key,o.label])).entries()];
  const visible=rows.filter(o=>!hidden.includes(o.key));
  const x=(t:number)=>42+(Math.max(start,Math.min(end,t))-start)/Math.max(1,end-start)*336;
  const y=(score:number)=>205-score*17;
  const tones=["fill-accent-soft stroke-accent text-accent-deep","fill-pain-soft stroke-pain text-pain","fill-violet-soft stroke-violet text-violet","fill-sky-soft stroke-sky text-sky-deep","fill-mint-soft stroke-mint text-mint-deep"];
  const axis=(t:number)=>date(start)===date(end)?new Date(t).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}):date(t);
  return <div className="mt-3">
    <svg viewBox="0 0 408 250" className="w-full overflow-visible" role="group" aria-label="Recent symptoms by time and severity">
      {[0,2,4,6,8,10].map(n=><g key={n}><line x1="42" x2="378" y1={y(n)} y2={y(n)} className="stroke-line" strokeDasharray="3 5"/><text x="30" y={y(n)+4} textAnchor="end" className="fill-muted text-[11px]">{n}</text></g>)}
      <text x="42" y="15" className="fill-muted text-[11px]">Severity / intensity</text>
      {visible.map(o=>{
        const i=keys.findIndex(([key])=>key===o.key),left=x(o.time),right=x(o.endTime??o.time);
        const band=!!o.endTime && right-left>=7;
        return <g key={o.id} role="button" tabIndex={0} className={`cursor-pointer ${tones[i%tones.length]}`} aria-label={`${o.label}, ${o.score} out of 10, ${stamp(o.time)}${o.endTime?` until ${stamp(o.endTime)}`:". Duration not recorded"}. Open log.`} onClick={()=>onSelect(o.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onSelect(o.id);}}}>
          <title>{o.label} · {o.score}/10 · {stamp(o.time)}{o.endTime?` — ${stamp(o.endTime)}`:""}</title>
          <rect x={left-10} y={y(o.score)-14} width={Math.max(28,right-left+20)} height="28" fill="transparent" stroke="none"/>
          {band?<rect x={left} y={y(o.score)-7} width={right-left} height="14" rx="4" strokeWidth="1.5"/>:<circle cx={left} cy={y(o.score)} r="6" strokeWidth="2"/>}
        </g>;
      })}
      <text x="42" y="232" className="fill-muted text-[11px]">{axis(start)}</text><text x="210" y="232" textAnchor="middle" className="fill-muted text-[11px]">{axis((start+end)/2)}</text><text x="378" y="232" textAnchor="end" className="fill-muted text-[11px]">{axis(end)}</text>
    </svg>
    <div className="divide-y divide-line" aria-label="Filter chart symptoms">{keys.map(([key,label],i)=><button key={key} type="button" aria-pressed={!hidden.includes(key)} className={`flex min-h-11 w-full items-center gap-3 py-2 text-left text-xs ${hidden.includes(key)?"text-muted line-through":"text-ink"}`} onClick={()=>setHidden(h=>h.includes(key)?h.filter(k=>k!==key):[...h,key])}>
      <svg viewBox="0 0 28 12" className={`h-3 w-7 shrink-0 ${tones[i%tones.length]}`} aria-hidden="true"><rect x="1" y="1" width="26" height="10" rx="3" strokeWidth="1.5"/></svg><span className="min-w-0 flex-1 break-words">{label}</span><span className="text-muted">{hidden.includes(key)?"Show":"Hide"}</span>
    </button>)}</div>
  </div>;
}
