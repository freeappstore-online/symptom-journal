import { useState } from "react";
import type { Entry } from "./store";
import { observations, recentWindow, trendBuckets } from "./recap";
export function HomeOverview({entries,onHistory,onOpen}:{entries:Entry[];onHistory:()=>void;onOpen:(e:Entry)=>void}) {
 const [days,setDays]=useState(7);
 const now=new Date(),window=recentWindow(days,now);
 const period=entries.filter(e=>Date.parse(e.occurredAt)>=window.start&&Date.parse(e.occurredAt)<=+now);
 const rows=observations(period),buckets=trendBuckets(rows,window.start,window.end,1);
 const temperatures=period.filter(e=>e.temperature).sort((a,b)=>Date.parse(a.occurredAt)-Date.parse(b.occurredAt));
 const latest=temperatures.at(-1),peak=Math.max(1,...buckets.map(b=>b.count));
 const lo=Math.floor(Math.min(36,...temperatures.map(e=>e.temperature!.celsius))),hi=Math.ceil(Math.max(39,...temperatures.map(e=>e.temperature!.celsius)));
 const x=(t:number)=>30+(t-window.start)/(window.end-window.start)*290;
 const dates=<><text x="30" y="122" className="fill-muted text-[10px]">{new Date(window.start).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</text><text x="320" y="122" textAnchor="end" className="fill-muted text-[10px]">{now.toLocaleDateString(undefined,{month:"short",day:"numeric"})}</text></>;
 return <section aria-label="Health overview" className="space-y-3">
  <div className="flex items-center justify-between gap-3"><h2 className="text-lg">Your overview</h2><select aria-label="Overview period" className="min-h-11 rounded-xl bg-panel px-3 text-sm font-semibold" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>In the past 7 days</option><option value={14}>In the past 14 days</option><option value={28}>In the past 28 days</option></select></div>
  <div className="rounded-3xl bg-panel p-4 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-base">Symptoms</h3><button type="button" className="min-h-11 text-sm font-bold text-accent" onClick={onHistory}>History →</button></div>
   <p className="text-sm text-muted"><strong className="text-ink-strong">{rows.length}</strong> symptom logs</p>
   {rows.length?<svg viewBox="0 0 340 130" className="h-32 w-full" role="img" aria-label="Daily number of symptom logs"><text x="22" y="25" textAnchor="end" className="fill-muted text-[10px]">{peak}</text><text x="22" y="104" textAnchor="end" className="fill-muted text-[10px]">0</text><line x1="30" x2="320" y1="100" y2="100" className="stroke-line"/>{buckets.map(b=><rect key={b.start} x={x(b.start)+1} y={100-b.count/peak*75} width={Math.max(2,290/days-3)} height={b.count/peak*75} rx="2" className="fill-accent"><title>{new Date(b.start).toLocaleDateString()}: {b.count} symptom logs</title></rect>)}{dates}</svg>:<p className="py-5 text-sm text-muted">No symptoms logged in this period.</p>}
  </div>
  <div className="rounded-3xl bg-panel p-4 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-base">Temperature</h3><button type="button" className="min-h-11 text-sm font-bold text-accent" onClick={onHistory}>History →</button></div>
   {latest?<><p className="text-sm text-muted"><strong className="text-lg text-ink-strong">{latest.temperature!.celsius.toFixed(1)} °C</strong> · Latest{latest.temperature!.method?` · ${latest.temperature!.method}`:""}</p><svg viewBox="0 0 340 130" className="h-32 w-full" role="group" aria-label="Temperature readings in degrees Celsius">{[lo,hi].map(n=><g key={n}><line x1="30" x2="320" y1={100-(n-lo)/(hi-lo)*75} y2={100-(n-lo)/(hi-lo)*75} className="stroke-line"/><text x="22" y={104-(n-lo)/(hi-lo)*75} textAnchor="end" className="fill-muted text-[10px]">{n}°</text></g>)}{temperatures.map(e=><g key={e.id} tabIndex={0} role="button" aria-label={`${e.temperature!.celsius} degrees Celsius, ${new Date(e.occurredAt).toLocaleString()}`} onClick={()=>onOpen(e)} onKeyDown={ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();onOpen(e);}}}><circle cx={x(Date.parse(e.occurredAt))} cy={100-(e.temperature!.celsius-lo)/(hi-lo)*75} r="12" fill="transparent"/><circle cx={x(Date.parse(e.occurredAt))} cy={100-(e.temperature!.celsius-lo)/(hi-lo)*75} r="4" className="fill-sky"/></g>)}{dates}</svg></>:<p className="py-5 text-sm text-muted">No temperature readings in this period.</p>}
  </div>
 </section>;
}
